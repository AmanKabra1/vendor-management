import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  KhataEntry,
  KhataEntryDocument,
  KhataEntryType,
  normalisePhone,
} from './khata.entity';
import { CreateKhataEntryDto } from './dto/khata.dto';
import { StoreService } from '../store/store.service';
import { UserService } from '../user/user.service';
import { AuthUser } from '../auth/current-user.decorator';

export interface KhataCustomer {
  customerPhone: string;
  customerName: string;
  credit: number;
  paid: number;
  balance: number;
  lastAt: Date;
  entries: number;
}

@Injectable()
export class KhataService {
  constructor(
    @InjectModel(KhataEntry.name)
    private readonly entryModel: Model<KhataEntryDocument>,
    private readonly stores: StoreService,
    private readonly users: UserService,
  ) {}

  /** Writes a credit or payment line. Only the shop that owns the book may. */
  async add(dto: CreateKhataEntryDto, user: AuthUser) {
    await this.stores.assertCanManage(dto.store, user);
    const phone = normalisePhone(dto.customerPhone);

    // Link the line to an account if this number already has one, so the
    // customer sees their own balance without the shop doing anything.
    const account = phone ? await this.users.findByPhone(phone) : null;

    return this.entryModel.create({
      store: dto.store,
      customerName: dto.customerName.trim(),
      customerPhone: phone,
      customerUser: account?._id ?? null,
      type: dto.type,
      amount: Math.round(Number(dto.amount)),
      note: dto.note ?? '',
      order: dto.order ?? null,
      createdBy: user.userId,
      at: dto.at ? new Date(dto.at) : new Date(),
    });
  }

  /** Full ledger for one store, newest first (optionally one customer). */
  async entries(storeId: string, user: AuthUser, phone?: string) {
    await this.stores.assertCanManage(storeId, user);
    const filter: Record<string, any> = { store: storeId };
    if (phone) filter.customerPhone = normalisePhone(phone);
    return this.entryModel.find(filter).sort({ at: -1 }).limit(300).exec();
  }

  /** One row per khata customer with their running balance, biggest first. */
  async customers(storeId: string, user: AuthUser): Promise<KhataCustomer[]> {
    await this.stores.assertCanManage(storeId, user);
    const rows = await this.entryModel.aggregate([
      { $match: { store: new Types.ObjectId(storeId) } },
      { $sort: { at: 1 } },
      {
        $group: {
          _id: '$customerPhone',
          customerName: { $last: '$customerName' },
          credit: {
            $sum: {
              $cond: [{ $eq: ['$type', KhataEntryType.Credit] }, '$amount', 0],
            },
          },
          paid: {
            $sum: {
              $cond: [{ $eq: ['$type', KhataEntryType.Payment] }, '$amount', 0],
            },
          },
          lastAt: { $max: '$at' },
          entries: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          customerPhone: '$_id',
          customerName: 1,
          credit: 1,
          paid: 1,
          balance: { $subtract: ['$credit', '$paid'] },
          lastAt: 1,
          entries: 1,
        },
      },
      { $sort: { balance: -1, lastAt: -1 } },
    ]);
    return rows as KhataCustomer[];
  }

  /** Headline numbers for the shop's khata tab. */
  async summary(storeId: string, user: AuthUser) {
    const customers = await this.customers(storeId, user);
    const outstanding = customers.reduce(
      (s, c) => s + Math.max(c.balance, 0),
      0,
    );
    const advance = customers.reduce((s, c) => s + Math.min(c.balance, 0), 0);
    return {
      customers: customers.length,
      withBalance: customers.filter((c) => c.balance > 0).length,
      outstanding,
      // Negative balances mean the customer has paid ahead.
      advance: Math.abs(advance),
      topDebtors: customers.filter((c) => c.balance > 0).slice(0, 5),
    };
  }

  /**
   * A customer's own khata across every shop they owe — same numbers the
   * shopkeeper sees, which is the point: no arguments on payday.
   */
  async mine(user: AuthUser) {
    const account = await this.users.findById(user.userId);
    const phone = normalisePhone(account?.phone || '');
    if (!phone) return { phone: '', totalOutstanding: 0, shops: [] };

    const rows = await this.entryModel.aggregate([
      {
        $match: {
          $or: [
            { customerPhone: phone },
            { customerUser: new Types.ObjectId(user.userId) },
          ],
        },
      },
      {
        $group: {
          _id: '$store',
          credit: {
            $sum: {
              $cond: [{ $eq: ['$type', KhataEntryType.Credit] }, '$amount', 0],
            },
          },
          paid: {
            $sum: {
              $cond: [{ $eq: ['$type', KhataEntryType.Payment] }, '$amount', 0],
            },
          },
          lastAt: { $max: '$at' },
        },
      },
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          storeId: '$_id',
          storeName: '$store.name',
          storePhone: '$store.phone',
          storeUpiId: '$store.upiId',
          credit: 1,
          paid: 1,
          balance: { $subtract: ['$credit', '$paid'] },
          lastAt: 1,
        },
      },
      { $sort: { balance: -1 } },
    ]);

    const totalOutstanding = rows.reduce(
      (s: number, r: any) => s + Math.max(r.balance, 0),
      0,
    );
    return { phone, totalOutstanding, shops: rows };
  }

  /** One customer's line-by-line history at one shop. */
  async customerLedger(storeId: string, phone: string, user: AuthUser) {
    await this.stores.assertCanManage(storeId, user);
    const normalised = normalisePhone(phone);
    const entries = await this.entryModel
      .find({ store: storeId, customerPhone: normalised })
      .sort({ at: -1 })
      .exec();
    if (!entries.length)
      throw new NotFoundException('No khata for this number');
    const balance = entries.reduce(
      (s, e) => s + (e.type === KhataEntryType.Credit ? e.amount : -e.amount),
      0,
    );
    return {
      customerPhone: normalised,
      customerName: entries[0].customerName,
      balance,
      entries,
    };
  }

  /** Removes a mistyped line. Shopkeepers fix numbers constantly. */
  async remove(id: string, user: AuthUser) {
    const entry = await this.entryModel.findById(id).exec();
    if (!entry) throw new NotFoundException('Entry not found');
    await this.stores.assertCanManage(String(entry.store), user);
    await entry.deleteOne();
    return { ok: true };
  }
}
