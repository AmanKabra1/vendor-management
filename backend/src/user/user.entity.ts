import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Role } from '../auth/role.enum';

export type UserDocument = HydratedDocument<User>;

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

  // For vendor users: links the account to its Vendor document. Null for admins.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Vendor', default: null })
  vendor: Types.ObjectId | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
