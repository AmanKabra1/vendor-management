import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SupplyOrder,
  SupplyOrderDocument,
  SupplyStatus,
} from './supply-order.entity';
import { CreateSupplyOrderDto } from './dto/supply-order.dto';
import { AuthUser } from '../auth/current-user.decorator';
import { Role } from '../auth/role.enum';

// Allowed status transitions and which side may perform them.
const SELLER_MOVES: Partial<Record<SupplyStatus, SupplyStatus>> = {
  [SupplyStatus.Placed]: SupplyStatus.Accepted,
  [SupplyStatus.Accepted]: SupplyStatus.Dispatched,
};

@Injectable()
export class SupplyOrderService {
  constructor(
    @InjectModel(SupplyOrder.name)
    private readonly model: Model<SupplyOrderDocument>,
  ) {}

  private isPlatformAdmin(user: AuthUser) {
    return user.role === Role.SuperAdmin || user.role === Role.Admin;
  }

  async create(dto: CreateSupplyOrderDto, buyerId: string) {
    const items = (dto.items || []).map((i) => ({
      product: i.product,
      name: i.name,
      unit: i.unit || 'unit',
      price: Number(i.price) || 0,
      quantity: Number(i.quantity) || 1,
    }));
    if (!items.length) throw new BadRequestException('No items in order');
    const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const count = await this.model.countDocuments().exec();
    return this.model.create({
      refNumber: `SO-${String(count + 1).padStart(4, '0')}`,
      buyer: buyerId,
      seller: dto.seller,
      items,
      totalAmount,
      note: dto.note || '',
      status: SupplyStatus.Placed,
    });
  }

  /** Buyer sees their purchases; supplier sees incoming; admin sees all. */
  findAll(user: AuthUser) {
    let filter: Record<string, any> = {};
    if (!this.isPlatformAdmin(user)) {
      // A distributor can be both buyer and seller — show both sides.
      filter = { $or: [{ buyer: user.userId }, { seller: user.userId }] };
    }
    return this.model
      .find(filter)
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  private async load(id: string) {
    const order = await this.model.findById(id).exec();
    if (!order) throw new NotFoundException('Supply order not found');
    return order;
  }

  /** Seller advances PLACED→ACCEPTED→DISPATCHED. */
  async advance(id: string, user: AuthUser) {
    const order = await this.load(id);
    if (!this.isPlatformAdmin(user) && String(order.seller) !== user.userId) {
      throw new ForbiddenException('Only the supplier can update this');
    }
    const next = SELLER_MOVES[order.status];
    if (!next) throw new BadRequestException(`Cannot advance from ${order.status}`);
    order.status = next;
    await order.save();
    return order;
  }

  /** Buyer confirms goods received (after DISPATCHED). */
  async receive(id: string, user: AuthUser) {
    const order = await this.load(id);
    if (!this.isPlatformAdmin(user) && String(order.buyer) !== user.userId) {
      throw new ForbiddenException('Only the buyer can confirm receipt');
    }
    if (order.status !== SupplyStatus.Dispatched) {
      throw new BadRequestException('Order must be dispatched first');
    }
    order.status = SupplyStatus.Received;
    await order.save();
    return order;
  }

  /** Either party cancels before dispatch. */
  async cancel(id: string, user: AuthUser) {
    const order = await this.load(id);
    const mine =
      String(order.buyer) === user.userId || String(order.seller) === user.userId;
    if (!this.isPlatformAdmin(user) && !mine) {
      throw new ForbiddenException('Not your order');
    }
    if ([SupplyStatus.Dispatched, SupplyStatus.Received].includes(order.status)) {
      throw new BadRequestException('Too late to cancel');
    }
    order.status = SupplyStatus.Cancelled;
    await order.save();
    return order;
  }
}
