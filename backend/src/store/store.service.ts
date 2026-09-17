import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  EMERGENCY_CATEGORIES,
  ESSENTIAL_CATEGORIES,
  Store,
  StoreCategory,
  StoreDocument,
  StoreStatus,
} from './store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { AuthUser } from '../auth/current-user.decorator';
import { Role } from '../auth/role.enum';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';

/** Filters the shop directory and /stores/nearby accept. */
export interface StoreQuery {
  category?: string;
  /** Comma-separated category keys. */
  categories?: string;
  essential?: boolean;
  emergency?: boolean;
  open?: boolean;
  udhaar?: boolean;
  is24x7?: boolean;
  pincode?: string;
  area?: string;
  city?: string;
  q?: string;
}

@Injectable()
export class StoreService {
  constructor(
    @InjectModel(Store.name) private readonly storeModel: Model<StoreDocument>,
    private readonly users: UserService,
    private readonly notifications: NotificationService,
  ) {}

  private isPlatformAdmin(user: AuthUser) {
    return user.role === Role.SuperAdmin || user.role === Role.Admin;
  }

  async create(dto: CreateStoreDto, ownerId: string, onboardedBy?: string) {
    const { lat, lng, ...rest } = dto;
    const location =
      lat != null && lng != null
        ? { type: 'Point', coordinates: [lng, lat] }
        : undefined;
    return this.storeModel.create({
      ...rest,
      ...(location ? { location } : {}),
      owner: ownerId,
      ...(onboardedBy ? { onboardedBy } : {}),
      status: StoreStatus.Pending,
    });
  }

  /**
   * SuperAdmin sees everything; an owner sees their own shops; counter staff
   * see the one shop they're attached to.
   */
  async findAll(user: AuthUser) {
    if (this.isPlatformAdmin(user)) {
      return this.storeModel.find({}).sort({ createdAt: -1 }).exec();
    }
    if (user.role === Role.StoreStaff) {
      const store = await this.storeForUser(user.userId);
      return store ? [store] : [];
    }
    return this.storeModel
      .find({ owner: user.userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, user: AuthUser) {
    const store = await this.storeModel.findById(id).exec();
    if (!store) throw new NotFoundException('Store not found');
    if (!this.isPlatformAdmin(user) && String(store.owner) !== user.userId) {
      throw new ForbiddenException('Not your store');
    }
    return store;
  }

  async update(id: string, dto: UpdateStoreDto, user: AuthUser) {
    const store = await this.findOne(id, user); // enforces ownership
    const { lat, lng, ...rest } = dto;
    Object.assign(store, rest);
    if (lat != null && lng != null) {
      store.location = { type: 'Point', coordinates: [lng, lat] };
    }
    await store.save();
    return store;
  }

  /** Hard-delete a shop. Admin-only (the controller enforces the role). */
  async remove(id: string) {
    const store = await this.storeModel.findById(id).exec();
    if (!store) throw new NotFoundException('Store not found');
    await store.deleteOne();
    return { ok: true, deleted: id };
  }

  async setStatus(id: string, status: StoreStatus, reason = '') {
    const store = await this.storeModel.findById(id).exec();
    if (!store) throw new NotFoundException('Store not found');
    store.status = status;
    store.rejectionReason = status === StoreStatus.Rejected ? reason : '';
    await store.save();
    if (status === StoreStatus.Approved) {
      const owner = await this.users.findById(String(store.owner));
      if (owner) this.notifications.approved(owner.email, owner.name, 'store');
    }
    return store;
  }

  /** Turns the directory filters into a Mongo query over live shops. */
  private buildFilter(query: StoreQuery = {}): FilterQuery<StoreDocument> {
    const filter: FilterQuery<StoreDocument> = {
      status: StoreStatus.Approved,
      isActive: true,
    };

    const keys = (query.categories || query.category || '')
      .split(',')
      .map((k) => k.trim().toUpperCase())
      .filter(Boolean);

    if (keys.length) {
      filter.category = { $in: keys };
    } else if (query.essential) {
      filter.category = { $in: ESSENTIAL_CATEGORIES };
    } else if (query.emergency) {
      // Anything flagged for emergencies, plus the inherently urgent categories.
      filter.$or = [
        { emergencyService: true },
        { is24x7: true },
        { category: { $in: EMERGENCY_CATEGORIES } },
      ];
    }

    if (query.open) filter.closedToday = { $ne: true };
    if (query.udhaar) filter.acceptsUdhaar = true;
    if (query.is24x7) filter.is24x7 = true;
    if (query.pincode) filter['address.pincode'] = query.pincode;
    if (query.area)
      filter['address.area'] = new RegExp(escapeRe(query.area), 'i');
    if (query.city)
      filter['address.city'] = new RegExp(escapeRe(query.city), 'i');
    if (query.q) {
      const re = new RegExp(escapeRe(query.q), 'i');
      filter.$and = [
        {
          $or: [
            { name: re },
            { nameLocal: re },
            { description: re },
            { 'address.landmark': re },
            { 'priceList.name': re },
          ],
        },
      ];
    }
    return filter;
  }

  /**
   * Approved stores within `radius` metres of a point, nearest first.
   * Optional category / essential / emergency / open filters let the customer
   * app ask for "water suppliers open now" instead of every shop in town.
   */
  nearby(lat: number, lng: number, radius = 5000, query: StoreQuery = {}) {
    return this.storeModel
      .find({
        ...this.buildFilter(query),
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radius,
          },
        },
      })
      .limit(60)
      .exec();
  }

  /**
   * Public shop directory — no login, no coordinates needed. A person in a kasba
   * searches by pincode / area name / shop type, which is how they actually think
   * about "where do I buy this".
   */
  directory(query: StoreQuery = {}) {
    return this.storeModel
      .find(this.buildFilter(query))
      .select(
        'name nameLocal category ownerName phone altPhone whatsapp address is24x7 closedToday ' +
          'homeDelivery acceptsUdhaar emergencyService operatingHours weeklyOff avgDeliveryMins ' +
          'paymentModes establishedYear photoUrl location rating ratingCount totalOrders ' +
          'minOrderValue deliveryRadiusKm priceList upiId description',
      )
      .sort({ is24x7: -1, rating: -1, totalOrders: -1 })
      .limit(100)
      .exec();
  }

  /** One public shop page (menu / rate list, timings, call buttons). */
  async publicOne(id: string) {
    const store = await this.storeModel
      .findOne({ _id: id, status: StoreStatus.Approved, isActive: true })
      .select(
        'name nameLocal category description ownerName phone altPhone whatsapp address is24x7 ' +
          'closedToday homeDelivery acceptsUdhaar emergencyService operatingHours weeklyOff ' +
          'avgDeliveryMins paymentModes gstNumber establishedYear photoUrl location rating ' +
          'ratingCount totalOrders minOrderValue deliveryRadiusKm deliveryChargeFlat ' +
          'serviceAreas priceList upiId',
      )
      .exec();
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  /** How many live shops exist per category — powers the directory tiles. */
  async categoryCounts(query: StoreQuery = {}) {
    const rows = await this.storeModel.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: this.buildFilter({ ...query, category: '', categories: '' }) },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r._id] = r.count;
    return counts;
  }

  /** Shops a field sales agent brought onto the platform. */
  onboardedBy(userId: string) {
    return this.storeModel
      .find({ onboardedBy: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /** The store a store-side user acts for (owner, or counter staff via User.store). */
  async storeForUser(userId: string): Promise<StoreDocument | null> {
    const owned = await this.storeModel.findOne({ owner: userId }).exec();
    if (owned) return owned;
    const account = await this.users.findById(userId);
    if (account?.store) return this.storeModel.findById(account.store).exec();
    return null;
  }

  /**
   * Store-side write access: the owner, the counter staff assigned to that
   * shop, or a platform admin. Staff need this because in practice the person
   * writing the khata and taking the phone order is rarely the licence holder.
   */
  async assertCanManage(storeId: string, user: AuthUser) {
    const store = await this.storeModel.findById(storeId).exec();
    if (!store) throw new NotFoundException('Store not found');
    if (this.isPlatformAdmin(user)) return store;
    if (String(store.owner) === user.userId) return store;
    if (user.role === Role.StoreStaff) {
      const account = await this.users.findById(user.userId);
      if (account?.store && String(account.store) === String(store._id)) {
        return store;
      }
    }
    throw new ForbiddenException('Not your store');
  }

  /** Shutter switch — pause or resume orders for the day. */
  async setShutter(id: string, closed: boolean, user: AuthUser) {
    const store = await this.assertCanManage(id, user);
    store.closedToday = closed;
    await store.save();
    return store;
  }

  /** Replace the shop's rate list (small shops keep no per-SKU inventory). */
  async setPriceList(id: string, items: Record<string, any>[], user: AuthUser) {
    const store = await this.assertCanManage(id, user);
    store.priceList = (items || [])
      .filter((i) => String(i?.name || '').trim())
      .map((i) => ({
        name: String(i.name).trim(),
        nameLocal: String(i.nameLocal || '').trim(),
        price: Number(i.price) || 0,
        unit: String(i.unit || 'unit'),
        available: i.available !== false,
      })) as any;
    await store.save();
    return store;
  }

  /**
   * Counter staff attached to a shop. A kirana is usually run by two or three
   * people (owner, son, hired boy) and they all need to take orders — so staff
   * are separate logins linked to the shop, not a shared password.
   */
  async staff(storeId: string, user: AuthUser) {
    await this.assertCanManage(storeId, user);
    return this.users.findStaffForStore(storeId);
  }

  /** Owner attaches an existing store_staff account (by email or mobile). */
  async addStaff(storeId: string, identifier: string, user: AuthUser) {
    const store = await this.assertCanManage(storeId, user);
    const key = String(identifier || '').trim();
    if (!key) throw new BadRequestException('Email or mobile is required');

    const account = key.includes('@')
      ? await this.users.findByEmail(key.toLowerCase())
      : await this.users.findByPhone(key);
    if (!account) {
      throw new NotFoundException(
        'No account with that email/mobile. Ask them to register as "Shop staff" first.',
      );
    }
    if (account.role !== Role.StoreStaff) {
      throw new BadRequestException(
        'That account is not a shop-staff account, so it cannot be attached to a shop.',
      );
    }
    account.store = store._id as any;
    account.isApproved = true;
    await account.save();
    return {
      id: String(account._id),
      name: account.name,
      email: account.email,
    };
  }

  /** Detach a staff member (they keep their login, lose shop access). */
  async removeStaff(storeId: string, staffId: string, user: AuthUser) {
    await this.assertCanManage(storeId, user);
    const account = await this.users.findById(staffId);
    if (!account || String(account.store) !== String(storeId)) {
      throw new NotFoundException('Not a staff member of this shop');
    }
    account.store = null;
    await account.save();
    return { ok: true };
  }

  /** All distinct categories currently live, for building filter chips. */
  liveCategories(): Promise<StoreCategory[]> {
    return this.storeModel
      .distinct('category', { status: StoreStatus.Approved, isActive: true })
      .exec();
  }
}

/** Escapes user input before it goes into a RegExp. */
function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
