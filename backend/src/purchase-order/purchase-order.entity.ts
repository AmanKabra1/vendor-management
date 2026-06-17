// src/purchase-order/purchase-order.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PurchaseOrderDocument = HydratedDocument<PurchaseOrder>;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class PurchaseOrder {
  @Prop({ required: true })
  poNumber: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Vendor', required: true })
  vendor: Types.ObjectId;

  @Prop()
  orderDate: Date;

  @Prop({ default: null })
  deliveryDate: Date;

  @Prop({ type: Object })
  items: any;

  @Prop()
  quantity: number;

  @Prop()
  status: string;

  @Prop({ default: null })
  qualityRating: number;

  @Prop()
  issueDate: Date;

  @Prop({ default: null })
  acknowledgmentDate: Date;
}

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);
