import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { Order, OrderDocument, PaymentStatus } from '../order/order.entity';
import { AuthUser } from '../auth/current-user.decorator';
import { Role } from '../auth/role.enum';

/**
 * Online payments via Razorpay (UPI/cards/wallets).
 * Works in test mode with RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET; if those are
 * absent every call reports `enabled:false` and the app stays on cash-on-delivery.
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly keyId = process.env.RAZORPAY_KEY_ID || '';
  private readonly keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {
    if (this.enabled) this.logger.log('Razorpay payments enabled');
    else this.logger.warn('Payments disabled — set RAZORPAY_KEY_ID/SECRET to enable');
  }

  get enabled() {
    return !!(this.keyId && this.keySecret);
  }

  private async loadOwnedOrder(orderId: string, user: AuthUser) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException('Order not found');
    const isAdmin = user.role === Role.SuperAdmin || user.role === Role.Admin;
    const isOwner = String(order.customerUser) === user.userId;
    if (!isAdmin && !isOwner) throw new ForbiddenException('Not your order');
    return order;
  }

  /** Create a Razorpay order for an app order's outstanding amount (in paise). */
  async createOrder(orderId: string, user: AuthUser) {
    const order = await this.loadOwnedOrder(orderId, user);
    const amount = Math.round(((order.totalAmount || 0) + (order.deliveryFee || 0)) * 100);

    if (!this.enabled) {
      return { enabled: false, amount, message: 'Online payments not configured — pay cash on delivery.' };
    }

    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'INR', receipt: String(order._id) }),
    });
    if (!res.ok) {
      this.logger.error(`Razorpay create order failed: ${res.status}`);
      throw new BadRequestException('Could not start payment');
    }
    const rzp = await res.json();
    return {
      enabled: true,
      keyId: this.keyId,
      rzpOrderId: rzp.id,
      amount,
      currency: 'INR',
      orderNumber: order.orderNumber,
    };
  }

  /** Verify Razorpay's signature and mark the order paid. */
  async verify(
    orderId: string,
    rzpOrderId: string,
    rzpPaymentId: string,
    signature: string,
    user: AuthUser,
  ) {
    const order = await this.loadOwnedOrder(orderId, user);
    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest('hex');
    if (expected !== signature) {
      throw new BadRequestException('Payment verification failed');
    }
    order.paymentStatus = PaymentStatus.Collected;
    await order.save();
    return { ok: true, paymentStatus: order.paymentStatus };
  }
}
