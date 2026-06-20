import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Product {
  // The supplier (wholesaler or distributor) who lists this product.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'GENERAL' })
  category: string;

  @Prop({ default: 'unit' })
  unit: string; // kg, packet, case, dozen…

  @Prop({ default: 0 })
  price: number; // wholesale price per unit

  @Prop({ default: 0 })
  stock: number;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
