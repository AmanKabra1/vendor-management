import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type StoreDocument = HydratedDocument<Store>;

export enum StoreCategory {
  Restaurant = 'RESTAURANT',
  Grocery = 'GROCERY',
  Pharmacy = 'PHARMACY',
  General = 'GENERAL',
  Other = 'OTHER',
}

export enum StoreStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Suspended = 'SUSPENDED',
}

@Schema({ _id: false })
export class StoreAddress {
  @Prop({ default: '' })
  street: string;

  @Prop({ default: '' })
  city: string;

  @Prop({ default: '' })
  state: string;

  @Prop({ default: '' })
  pincode: string;

  @Prop({ default: '' })
  landmark: string;
}
const StoreAddressSchema = SchemaFactory.createForClass(StoreAddress);

// GeoJSON Point: coordinates are [longitude, latitude].
@Schema({ _id: false })
export class GeoPoint {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number], default: [0, 0] })
  coordinates: number[];
}
const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);

@Schema({ _id: false })
export class StoreDocumentFile {
  @Prop({ default: '' })
  type: string;

  @Prop({ default: '' })
  url: string;

  @Prop({ default: false })
  verified: boolean;
}
const StoreDocumentFileSchema = SchemaFactory.createForClass(StoreDocumentFile);

@Schema({ _id: false })
export class OperatingHours {
  @Prop({ default: '09:00' })
  open: string;

  @Prop({ default: '21:00' })
  close: string;

  @Prop({ type: [String], default: [] })
  days: string[];
}
const OperatingHoursSchema = SchemaFactory.createForClass(OperatingHours);

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Store {
  @Prop({ required: true })
  name: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ default: '' })
  email: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ type: String, enum: StoreCategory, default: StoreCategory.General })
  category: StoreCategory;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: StoreAddressSchema, default: () => ({}) })
  address: StoreAddress;

  @Prop({ type: GeoPointSchema, default: () => ({}) })
  location: GeoPoint;

  @Prop({ type: OperatingHoursSchema, default: () => ({}) })
  operatingHours: OperatingHours;

  @Prop({ type: [StoreDocumentFileSchema], default: [] })
  documents: StoreDocumentFile[];

  @Prop({ type: String, enum: StoreStatus, default: StoreStatus.Pending })
  status: StoreStatus;

  @Prop({ default: '' })
  rejectionReason: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  totalOrders: number;
}

export const StoreSchema = SchemaFactory.createForClass(Store);

// Geospatial index powers GET /stores/nearby.
StoreSchema.index({ location: '2dsphere' });
