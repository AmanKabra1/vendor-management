import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Role } from '../auth/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class GeoCoordinates {
  @Prop({ default: null })
  lat: number;

  @Prop({ default: null })
  lng: number;
}
const GeoCoordinatesSchema = SchemaFactory.createForClass(GeoCoordinates);

@Schema({ _id: false })
export class Address {
  @Prop({ default: '' })
  street: string;

  @Prop({ default: '' })
  city: string;

  @Prop({ default: '' })
  state: string;

  @Prop({ default: '' })
  pincode: string;

  @Prop({ type: GeoCoordinatesSchema, default: () => ({}) })
  coordinates: GeoCoordinates;
}
const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: Role, default: Role.Vendor })
  role: Role;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  avatar: string;

  // Email/phone/identity verified.
  @Prop({ default: false })
  isVerified: boolean;

  // SuperAdmin has approved this account (gates store owners & riders).
  @Prop({ default: false })
  isApproved: boolean;

  // Soft enable/disable switch.
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: AddressSchema, default: () => ({}) })
  address: Address;

  // For vendor/store users: links the account to its Vendor document. Null otherwise.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Vendor', default: null })
  vendor: Types.ObjectId | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
