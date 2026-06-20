import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type SupplyOrderDocument = HydratedDocument<SupplyOrder>;

export enum SupplyStatus {
  Placed = 'PLACED',
  Accepted = 'ACCEPTED',
  Dispatched = 'DISPATCHED',
  Received = 'RECEIVED',
  Cancelled = 'CANCELLED',
}

@Schema({ _id: false })
export class SupplyItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product' })
  product: Types.ObjectId;

  @Prop() name: string;
  @Prop({ default: 'unit' }) unit: string;
  @Prop({ default: 0 }) price: number;
  @Prop({ default: 1 }) quantity: number;
}
const SupplyItemSchema = SchemaFactory.createForClass(SupplyItem);

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class SupplyOrder {
  @Prop({ default: '' })
  refNumber: string;

  // Who is ordering (kirana store owner or a distributor restocking).
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  buyer: Types.ObjectId;

  // Supplier fulfilling it (wholesaler or distributor).
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  seller: Types.ObjectId;

  @Prop({ type: [SupplyItemSchema], default: [] })
  items: SupplyItem[];

  @Prop({ default: 0 })
  totalAmount: number;

  @Prop({ type: String, enum: SupplyStatus, default: SupplyStatus.Placed })
  status: SupplyStatus;

  @Prop({ default: '' })
  note: string;
}

export const SupplyOrderSchema = SchemaFactory.createForClass(SupplyOrder);
