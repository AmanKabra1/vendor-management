import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type RiderDocument = HydratedDocument<Rider>;

export enum VehicleType {
  Bicycle = 'BICYCLE',
  Motorcycle = 'MOTORCYCLE',
  Scooter = 'SCOOTER',
  Car = 'CAR',
  Van = 'VAN',
}

export enum Availability {
  Available = 'AVAILABLE',
  OnDelivery = 'ON_DELIVERY',
  Offline = 'OFFLINE',
  OnBreak = 'ON_BREAK',
}

export enum DeliveryPlatform {
  Uber = 'UBER',
  Zomato = 'ZOMATO',
  Swiggy = 'SWIGGY',
  Blinkit = 'BLINKIT',
  Zepto = 'ZEPTO',
  Direct = 'DIRECT',
}

export enum RiderDocType {
  License = 'LICENSE',
  Aadhar = 'AADHAR',
  Pan = 'PAN',
  Rc = 'RC',
  Insurance = 'INSURANCE',
}

@Schema({ _id: false })
export class RiderDocFile {
  @Prop({ type: String, enum: RiderDocType })
  type: RiderDocType;

  @Prop({ default: '' })
  url: string;

  @Prop({ default: false })
  verified: boolean;
}
const RiderDocFileSchema = SchemaFactory.createForClass(RiderDocFile);

@Schema({ _id: false })
export class WorkingZone {
  @Prop({ default: '' })
  area: string;

  @Prop({ default: '' })
  city: string;

  @Prop({ default: '' })
  pincode: string;
}
const WorkingZoneSchema = SchemaFactory.createForClass(WorkingZone);

@Schema({ _id: false })
export class TimeSlot {
  @Prop({ default: '' })
  day: string;

  @Prop({ default: '' })
  startTime: string;

  @Prop({ default: '' })
  endTime: string;

  @Prop({ type: String, enum: DeliveryPlatform, default: DeliveryPlatform.Direct })
  platform: DeliveryPlatform;
}
const TimeSlotSchema = SchemaFactory.createForClass(TimeSlot);

// GeoJSON Point: [longitude, latitude].
@Schema({ _id: false })
export class GeoPoint {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number], default: [0, 0] })
  coordinates: number[];
}
const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);

@Schema({ _id: false })
export class BankDetails {
  @Prop({ default: '' })
  accountNumber: string;

  @Prop({ default: '' })
  ifsc: string;

  @Prop({ default: '' })
  bankName: string;

  @Prop({ default: '' })
  upi: string;
}
const BankDetailsSchema = SchemaFactory.createForClass(BankDetails);

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Rider {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  user: Types.ObjectId;

  @Prop({ type: String, enum: VehicleType, default: VehicleType.Motorcycle })
  vehicleType: VehicleType;

  @Prop({ default: '' })
  vehicleNumber: string;

  @Prop({ default: '' })
  licenseNumber: string;

  @Prop({ type: [RiderDocFileSchema], default: [] })
  documents: RiderDocFile[];

  @Prop({ type: GeoPointSchema, default: () => ({}) })
  currentLocation: GeoPoint;

  @Prop({ type: String, enum: Availability, default: Availability.Offline })
  availability: Availability;

  @Prop({ type: [String], enum: DeliveryPlatform, default: [] })
  preferredPlatforms: DeliveryPlatform[];

  @Prop({ type: [WorkingZoneSchema], default: [] })
  workingZones: WorkingZone[];

  @Prop({ type: [TimeSlotSchema], default: [] })
  timeSlots: TimeSlot[];

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  totalDeliveries: number;

  @Prop({ default: 0 })
  earningsTotal: number;

  // True once all uploaded documents are verified.
  @Prop({ default: false })
  isVerified: boolean;

  // SuperAdmin approval gate.
  @Prop({ default: false })
  isApproved: boolean;

  @Prop({ type: BankDetailsSchema, default: () => ({}) })
  bankDetails: BankDetails;
}

export const RiderSchema = SchemaFactory.createForClass(Rider);

// Geospatial index powers GET /riders/nearby.
RiderSchema.index({ currentLocation: '2dsphere' });
