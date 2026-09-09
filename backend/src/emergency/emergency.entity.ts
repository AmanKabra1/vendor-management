import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type EmergencyContactDocument = HydratedDocument<EmergencyContact>;
export type SosAlertDocument = HydratedDocument<SosAlert>;

/** The kinds of help a town actually calls for. */
export enum EmergencyType {
  Ambulance = 'AMBULANCE',
  Hospital = 'HOSPITAL',
  Chemist24x7 = 'CHEMIST_24X7',
  BloodBank = 'BLOOD_BANK',
  FireBrigade = 'FIRE_BRIGADE',
  Police = 'POLICE',
  GasLeak = 'GAS_LEAK',
  Electricity = 'ELECTRICITY',
  WaterTanker = 'WATER_TANKER',
  Veterinary = 'VETERINARY',
  WomenHelpline = 'WOMEN_HELPLINE',
  ChildHelpline = 'CHILD_HELPLINE',
  Disaster = 'DISASTER',
  Municipality = 'MUNICIPALITY',
  Towing = 'TOWING',
  Other = 'OTHER',
}

@Schema({ _id: false })
export class GeoPoint {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({ type: [Number], default: [0, 0] })
  coordinates: number[];
}
const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);

/**
 * A local emergency number. National helplines (108, 101, 112…) are built into
 * the service as constants; this collection holds the *local* ones an admin or
 * a verified shopkeeper adds — the nursing home two streets away, the tanker
 * wala, the gas agency's night number.
 */
@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class EmergencyContact {
  @Prop({ type: String, enum: EmergencyType, required: true })
  type: EmergencyType;

  @Prop({ required: true })
  name: string;

  // Name in the local script.
  @Prop({ default: '' })
  nameLocal: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: '' })
  altPhone: string;

  @Prop({ default: '' })
  address: string;

  @Prop({ default: '' })
  area: string;

  @Prop({ default: '' })
  city: string;

  @Prop({ default: '' })
  state: string;

  @Prop({ default: '' })
  pincode: string;

  @Prop({ type: GeoPointSchema, default: () => ({}) })
  location: GeoPoint;

  @Prop({ default: true })
  is24x7: boolean;

  // "Has oxygen", "ICU van", "female doctor available", "5000L tanker"
  @Prop({ default: '' })
  notes: string;

  // An admin confirmed the number works. Unverified entries are shown last.
  @Prop({ default: false })
  verified: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  addedBy: Types.ObjectId | null;
}

export const EmergencyContactSchema =
  SchemaFactory.createForClass(EmergencyContact);
EmergencyContactSchema.index({ location: '2dsphere' });
EmergencyContactSchema.index({ type: 1, city: 1, pincode: 1 });

export enum SosStatus {
  Open = 'OPEN',
  Acknowledged = 'ACKNOWLEDGED',
  Resolved = 'RESOLVED',
  Cancelled = 'CANCELLED',
}

/**
 * A help request raised from the app. Riders are already spread across the town
 * with phones and vehicles, so an open SOS is shown to nearby riders, shops and
 * the admin — the fastest responder in a kasba is usually a neighbour, not a
 * control room.
 */
@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class SosAlert {
  @Prop({ type: String, enum: EmergencyType, default: EmergencyType.Other })
  type: EmergencyType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  raisedBy: Types.ObjectId | null;

  @Prop({ default: '' })
  name: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  message: string;

  @Prop({ default: '' })
  address: string;

  @Prop({ default: '' })
  landmark: string;

  @Prop({ type: GeoPointSchema, default: () => ({}) })
  location: GeoPoint;

  @Prop({ type: String, enum: SosStatus, default: SosStatus.Open })
  status: SosStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  acknowledgedBy: Types.ObjectId | null;

  @Prop({ default: '' })
  responseNote: string;

  @Prop({ default: null })
  resolvedAt: Date;
}

export const SosAlertSchema = SchemaFactory.createForClass(SosAlert);
SosAlertSchema.index({ location: '2dsphere' });
SosAlertSchema.index({ status: 1, createdAt: -1 });
