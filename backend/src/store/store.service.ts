import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Store, StoreDocument, StoreStatus } from './store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { AuthUser } from '../auth/current-user.decorator';
import { Role } from '../auth/role.enum';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';

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

  async create(dto: CreateStoreDto, ownerId: string) {
    const { lat, lng, ...rest } = dto;
    const location =
      lat != null && lng != null
        ? { type: 'Point', coordinates: [lng, lat] }
        : undefined;
    return this.storeModel.create({
      ...rest,
      ...(location ? { location } : {}),
      owner: ownerId,
      status: StoreStatus.Pending,
    });
  }

  /** SuperAdmin sees everything; a store owner sees only their own stores. */
  findAll(user: AuthUser) {
    const filter = this.isPlatformAdmin(user) ? {} : { owner: user.userId };
    return this.storeModel.find(filter).sort({ createdAt: -1 }).exec();
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

  /**
   * Approved stores within `radius` metres of a point, nearest first.
   */
  nearby(lat: number, lng: number, radius = 5000) {
    return this.storeModel
      .find({
        status: StoreStatus.Approved,
        isActive: true,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radius,
          },
        },
      })
      .exec();
  }
}
