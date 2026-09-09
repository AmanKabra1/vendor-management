import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FREQUENCY_DAYS,
  Refill,
  RefillDocument,
  RefillFrequency,
} from './refill.entity';
import { CreateRefillDto, UpdateRefillDto } from './dto/refill.dto';
import { StoreService } from '../store/store.service';
import { UserService } from '../user/user.service';
import { AuthUser } from '../auth/current-user.decorator';

/** Start of the given day, so "due today" ignores clock time. */
function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

@Injectable()
export class RefillService {
  constructor(
    @InjectModel(Refill.name)
    private readonly refillModel: Model<RefillDocument>,
    private readonly stores: StoreService,
    private readonly users: UserService,
  ) {}

  async create(dto: CreateRefillDto, user: AuthUser) {
    const account = await this.users.findById(user.userId);
    return this.refillModel.create({
      ...dto,
      customerUser: user.userId,
      customerName: dto.customerName || account?.name || '',
      phone: dto.phone || account?.phone || '',
      landmark: dto.landmark || account?.address?.landmark || '',
      nextDate: dto.nextDate ? new Date(dto.nextDate) : startOfDay(),
      frequency: dto.frequency ?? RefillFrequency.Weekly,
    });
  }

  mine(user: AuthUser) {
    return this.refillModel
      .find({ customerUser: user.userId })
      .populate('store', 'name phone whatsapp category address')
      .sort({ isActive: -1, nextDate: 1 })
      .exec();
  }

  /**
   * The shop's delivery round: what's due today or overdue, then what's coming.
   * Overdue first — a missed water can is someone with nothing to drink.
   */
  async forStore(storeId: string, user: AuthUser) {
    await this.stores.assertCanManage(storeId, user);
    const today = startOfDay();
    const rows = await this.refillModel
      .find({ store: storeId, isActive: true })
      .populate('customerUser', 'name phone')
      .sort({ nextDate: 1 })
      .exec();
    return {
      due: rows.filter((r) => new Date(r.nextDate) <= today),
      upcoming: rows.filter((r) => new Date(r.nextDate) > today),
      total: rows.length,
    };
  }

  private async ownedByCustomer(id: string, user: AuthUser) {
    const refill = await this.refillModel.findById(id).exec();
    if (!refill) throw new NotFoundException('Refill not found');
    if (String(refill.customerUser) !== user.userId) {
      throw new ForbiddenException('Not your refill');
    }
    return refill;
  }

  async update(id: string, dto: UpdateRefillDto, user: AuthUser) {
    const refill = await this.ownedByCustomer(id, user);
    const { nextDate, ...rest } = dto;
    Object.assign(refill, rest);
    if (nextDate) refill.nextDate = new Date(nextDate);
    await refill.save();
    return refill;
  }

  async remove(id: string, user: AuthUser) {
    const refill = await this.ownedByCustomer(id, user);
    await refill.deleteOne();
    return { ok: true };
  }

  /**
   * The shop ticks off a delivery; the next date rolls forward by the schedule.
   * On-demand refills simply go quiet until the customer asks again.
   */
  async markDelivered(id: string, user: AuthUser) {
    const refill = await this.refillModel.findById(id).exec();
    if (!refill) throw new NotFoundException('Refill not found');
    await this.stores.assertCanManage(String(refill.store), user);

    const days = FREQUENCY_DAYS[refill.frequency] ?? 7;
    refill.lastDeliveredAt = new Date();
    refill.deliveredCount += 1;
    if (days > 0) {
      const base = startOfDay();
      base.setDate(base.getDate() + days);
      refill.nextDate = base;
    } else {
      refill.isActive = false; // on-demand: wait for the next request
    }
    await refill.save();
    return refill;
  }

  /** Customer defers a delivery ("we're out of town till Sunday"). */
  async snooze(id: string, days: number, user: AuthUser) {
    const refill = await this.ownedByCustomer(id, user);
    const next = startOfDay(refill.nextDate);
    next.setDate(next.getDate() + Math.max(1, Math.min(days || 1, 60)));
    refill.nextDate = next;
    await refill.save();
    return refill;
  }
}
