// src/vendor/vendor.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VendorDocument = HydratedDocument<Vendor>;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Vendor {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  contactDetails: string;

  @Prop({ default: '' })
  address: string;

  @Prop({ required: true, unique: true })
  vendorCode: string;

  @Prop({ default: 0 })
  onTimeDeliveryRate: number;

  @Prop({ default: 0 })
  qualityRatingAvg: number;

  @Prop({ default: 0 })
  averageResponseTime: number;

  @Prop({ default: 0 })
  fulfillmentRate: number;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
