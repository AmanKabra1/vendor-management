import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
  CancelledBy,
  PaymentMethod,
  PaymentStatus,
} from './order.entity';
import { Store, StoreDocument } from '../store/store.entity';
import { Rider, RiderDocument } from '../rider/rider.entity';
import { CreateOrderDto } from './dto/order.dto';
import { AuthUser } from '../auth/current-user.decorator';
import { Role } from '../auth/role.enum';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Store.name) private readonly storeModel: Model<StoreDocument>,
    @InjectModel(Rider.name) private readonly riderModel: Model<RiderDocument>,
    private readonly tracking: TrackingGateway,
    private readonly users: UserService,
    private readonly notifications: NotificationService,
  ) {}

  /** Persist an order and push its new status to live subscribers. */
  private async saveAndBroadcast(order: OrderDocument) {
    await order.save();
    this.tracking.emitOrderStatus(String(order._id), order.status);
    return order;
  }

  private isPlatformAdmin(user: AuthUser) {
    return user.role === Role.SuperAdmin || user.role === Role.Admin;
  }

  private addTimeline(order: OrderDocument, status: string, user: AuthUser, note = '') {
    order.timeline.push({ status, note, updatedBy: user.role, at: new Date() } as any);
  }

  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const seq = (await this.orderModel.countDocuments().exec()) + 1;
    return `RF-${ymd}-${String(seq).padStart(4, '0')}`;
  }

  /** The Rider profile id for the acting rider user (throws if none). */
  private async actingRiderId(user: AuthUser): Promise<string> {
    const rider = await this.riderModel.findOne({ user: user.userId }).exec();
    if (!rider) throw new ForbiddenException('No rider profile for this user');
    return String(rider._id);
  }

  async create(dto: CreateOrderDto, user: AuthUser) {
    const store = await this.storeModel.findById(dto.store).exec();
    if (!store) throw new NotFoundException('Store not found');
    if (!this.isPlatformAdmin(user) && String(store.owner) !== user.userId) {
      throw new ForbiddenException('Not your store');
    }

    const orderNumber = await this.generateOrderNumber();
    const order = new this.orderModel({
      orderNumber,
      store: store._id,
      customer: dto.customer,
      items: dto.items ?? [],
      totalAmount: dto.totalAmount ?? 0,
      deliveryFee: dto.deliveryFee ?? 0,
      priority: dto.priority,
      paymentMethod: dto.paymentMethod,
      pickupLocation: {
        address: store.address?.street || store.name,
        lat: store.location?.coordinates?.[1] ?? null,
        lng: store.location?.coordinates?.[0] ?? null,
      },
      dropLocation: {
        address: dto.customer?.address || '',
        lat: dto.customer?.lat ?? null,
        lng: dto.customer?.lng ?? null,
      },
      status: OrderStatus.Created,
    });
    this.addTimeline(order, OrderStatus.Created, user, 'Order created');
    return this.saveAndBroadcast(order);
  }

  async findAll(user: AuthUser) {
    let filter: Record<string, any> = {};
    if (!this.isPlatformAdmin(user)) {
      if (user.role === Role.Rider) {
        const rider = await this.riderModel.findOne({ user: user.userId }).exec();
        filter = { rider: rider?._id ?? null };
      } else {
        // Store owner: orders across the stores they own.
        const stores = await this.storeModel.find({ owner: user.userId }).select('_id').exec();
        filter = { store: { $in: stores.map((s) => s._id) } };
      }
    }
    return this.orderModel
      .find(filter)
      .populate('store', 'name vendorCode')
      .populate('rider')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, user: AuthUser) {
    const order = await this.orderModel
      .findById(id)
      .populate('store')
      .populate('rider')
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    await this.assertCanView(order, user);
    return order;
  }

  private async assertCanView(order: OrderDocument, user: AuthUser) {
    if (this.isPlatformAdmin(user)) return;
    if (user.role === Role.Rider) {
      const riderId = await this.actingRiderId(user).catch(() => null);
      const oid = String((order.rider as any)?._id ?? order.rider);
      if (riderId && oid === riderId) return;
    } else {
      const storeId = String((order.store as any)?._id ?? order.store);
      const store = await this.storeModel.findById(storeId).exec();
      if (store && String(store.owner) === user.userId) return;
    }
    throw new ForbiddenException('Not allowed to view this order');
  }

  // --- store-side action ---
  async assignRider(id: string, riderId: string, user: AuthUser) {
    const order = await this.loadStoreOwned(id, user);
    const rider = await this.riderModel.findById(riderId).exec();
    if (!rider) throw new NotFoundException('Rider not found');
    if (!rider.isApproved) throw new BadRequestException('Rider not approved');

    order.rider = rider._id as any;
    order.status = OrderStatus.RiderAssigned;
    order.otp = String(Math.floor(1000 + Math.random() * 9000));
    this.addTimeline(order, OrderStatus.RiderAssigned, user, `Assigned rider ${riderId}`);
    await this.saveAndBroadcast(order);
    const riderUser = await this.users.findById(String(rider.user));
    if (riderUser) {
      this.notifications.orderAssigned(
        riderUser.email,
        riderUser.name,
        order.orderNumber,
      );
    }
    return order;
  }

  // --- rider-side actions ---
  async reject(id: string, user: AuthUser) {
    const order = await this.loadRiderOwned(id, user);
    order.rider = null;
    order.status = OrderStatus.Created;
    order.otp = '';
    this.addTimeline(order, OrderStatus.Created, user, 'Rider rejected — back to pool');
    return this.saveAndBroadcast(order);
  }

  async accept(id: string, user: AuthUser) {
    const order = await this.loadRiderOwned(id, user);
    if (order.status !== OrderStatus.RiderAssigned) {
      throw new BadRequestException('Order is not awaiting acceptance');
    }
    this.addTimeline(order, order.status, user, 'Rider accepted');
    return this.saveAndBroadcast(order);
  }

  async pickup(id: string, user: AuthUser) {
    const order = await this.loadRiderOwned(id, user);
    if (order.status !== OrderStatus.RiderAssigned) {
      throw new BadRequestException('Order must be assigned before pickup');
    }
    order.status = OrderStatus.PickedUp;
    this.addTimeline(order, OrderStatus.PickedUp, user, 'Picked up from store');
    return this.saveAndBroadcast(order);
  }

  async deliver(id: string, otp: string, user: AuthUser) {
    const order = await this.loadRiderOwned(id, user);
    if (![OrderStatus.PickedUp, OrderStatus.InTransit].includes(order.status)) {
      throw new BadRequestException('Order must be picked up before delivery');
    }
    if (!order.otp || order.otp !== otp) {
      throw new BadRequestException('Invalid delivery OTP');
    }
    order.status = OrderStatus.Delivered;
    order.actualDeliveryTime = new Date();
    if (order.paymentMethod === PaymentMethod.Cod) {
      order.paymentStatus = PaymentStatus.Collected;
    }
    this.addTimeline(order, OrderStatus.Delivered, user, 'Delivered to customer');
    await this.saveAndBroadcast(order);

    // Side-effects: bump counters.
    await this.riderModel.findByIdAndUpdate(order.rider, {
      $inc: { totalDeliveries: 1 },
    });
    await this.storeModel.findByIdAndUpdate(order.store, {
      $inc: { totalOrders: 1 },
    });
    return order;
  }

  async cancel(id: string, reason: string, user: AuthUser) {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Order not found');
    // Store owner (of this order) or platform admin may cancel.
    if (!this.isPlatformAdmin(user)) {
      const store = await this.storeModel.findById(order.store).exec();
      if (!store || String(store.owner) !== user.userId) {
        throw new ForbiddenException('Not allowed to cancel this order');
      }
    }
    if (order.status === OrderStatus.Delivered) {
      throw new BadRequestException('Delivered orders cannot be cancelled');
    }
    order.status = OrderStatus.Cancelled;
    order.cancelReason = reason || '';
    order.cancelledBy = this.isPlatformAdmin(user)
      ? CancelledBy.System
      : CancelledBy.Store;
    this.addTimeline(order, OrderStatus.Cancelled, user, reason || 'Cancelled');
    return this.saveAndBroadcast(order);
  }

  /** Public, sanitized tracking view for the customer link (no auth). */
  async publicTracking(id: string) {
    const order = await this.orderModel
      .findById(id)
      .populate('store', 'name')
      .populate({ path: 'rider', populate: { path: 'user', select: 'name' } })
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    const rider: any = order.rider;
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      storeName: (order.store as any)?.name ?? '',
      customerName: order.customer?.name ?? '',
      pickupLocation: order.pickupLocation,
      dropLocation: order.dropLocation,
      timeline: order.timeline,
      riderName: rider?.user?.name ?? null,
      riderLocation: rider?.currentLocation ?? null,
    };
  }

  async stats(user: AuthUser) {
    const match = await this.scopeMatch(user);
    const rows = await this.orderModel.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      byStatus[r._id] = r.count;
      total += r.count;
    }
    return { total, byStatus };
  }

  // --- helpers that enforce who can mutate ---
  private async loadStoreOwned(id: string, user: AuthUser) {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Order not found');
    if (!this.isPlatformAdmin(user)) {
      const store = await this.storeModel.findById(order.store).exec();
      if (!store || String(store.owner) !== user.userId) {
        throw new ForbiddenException('Not your store order');
      }
    }
    return order;
  }

  private async loadRiderOwned(id: string, user: AuthUser) {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Order not found');
    if (this.isPlatformAdmin(user)) return order;
    const riderId = await this.actingRiderId(user);
    if (String(order.rider) !== riderId) {
      throw new ForbiddenException('Not your assigned order');
    }
    return order;
  }

  private async scopeMatch(user: AuthUser): Promise<Record<string, any>> {
    if (this.isPlatformAdmin(user)) return {};
    if (user.role === Role.Rider) {
      const rider = await this.riderModel.findOne({ user: user.userId }).exec();
      return { rider: rider?._id ?? null };
    }
    const stores = await this.storeModel.find({ owner: user.userId }).select('_id').exec();
    return { store: { $in: stores.map((s) => s._id) } };
  }
}
