import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  Created = 'CREATED',
  RiderAssigned = 'RIDER_ASSIGNED',
  PickedUp = 'PICKED_UP',
  InTransit = 'IN_TRANSIT',
  Delivered = 'DELIVERED',
  Cancelled = 'CANCELLED',
  Failed = 'FAILED',
}

export enum OrderPriority {
  Normal = 'NORMAL',
  Express = 'EXPRESS',
  Scheduled = 'SCHEDULED',
}

export enum PaymentMethod {
  Cod = 'COD',
  Prepaid = 'PREPAID',
  Wallet = 'WALLET',
}

export enum PaymentStatus {
  Pending = 'PENDING',
  Collected = 'COLLECTED',
  Settled = 'SETTLED',
}

export enum CancelledBy {
  Store = 'STORE',
  Rider = 'RIDER',
  Customer = 'CUSTOMER',
  System = 'SYSTEM',
}

@Schema({ _id: false })
export class CustomerInfo {
  @Prop({ default: '' })
  name: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  address: string;

  @Prop({ default: null })
  lat: number;

  @Prop({ default: null })
  lng: number;
}
const CustomerInfoSchema = SchemaFactory.createForClass(CustomerInfo);

@Schema({ _id: false })
export class OrderItem {
  @Prop({ default: '' })
  name: string;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ default: 0 })
  price: number;

  @Prop({ default: 0 })
  weight: number;
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class LocationPoint {
  @Prop({ default: '' })
  address: string;

  @Prop({ default: null })
  lat: number;

  @Prop({ default: null })
  lng: number;
}
const LocationPointSchema = SchemaFactory.createForClass(LocationPoint);

@Schema({ _id: false })
export class TimelineEntry {
  @Prop()
  status: string;

  @Prop({ default: '' })
  note: string;

  @Prop({ default: '' })
  updatedBy: string;

  @Prop({ default: Date.now })
  at: Date;
}
const TimelineEntrySchema = SchemaFactory.createForClass(TimelineEntry);

@Schema({ _id: false })
export class OrderRating {
  @Prop({ default: 0 })
  byStore: number;

  @Prop({ default: 0 })
  byCustomer: number;

  @Prop({ default: 0 })
  byRider: number;
}
const OrderRatingSchema = SchemaFactory.createForClass(OrderRating);

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Store', required: true })
  store: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Rider', default: null })
  rider: Types.ObjectId | null;

  @Prop({ type: CustomerInfoSchema, default: () => ({}) })
  customer: CustomerInfo;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({ default: 0 })
  totalAmount: number;

  @Prop({ default: 0 })
  deliveryFee: number;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.Created })
  status: OrderStatus;

  @Prop({ type: String, enum: OrderPriority, default: OrderPriority.Normal })
  priority: OrderPriority;

  @Prop({ default: null })
  scheduledTime: Date;

  @Prop({ type: LocationPointSchema, default: () => ({}) })
  pickupLocation: LocationPoint;

  @Prop({ type: LocationPointSchema, default: () => ({}) })
  dropLocation: LocationPoint;

  @Prop({ default: 0 })
  distance: number;

  @Prop({ default: 0 })
  estimatedTime: number;

  @Prop({ default: null })
  actualDeliveryTime: Date;

  @Prop({ default: '' })
  cancelReason: string;

  @Prop({ type: String, enum: CancelledBy, default: null })
  cancelledBy: CancelledBy;

  @Prop({ type: String, enum: PaymentMethod, default: PaymentMethod.Cod })
  paymentMethod: PaymentMethod;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.Pending })
  paymentStatus: PaymentStatus;

  @Prop({ default: '' })
  otp: string;

  @Prop({ type: [TimelineEntrySchema], default: [] })
  timeline: TimelineEntry[];

  @Prop({ type: OrderRatingSchema, default: () => ({}) })
  rating: OrderRating;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
