import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type KhataEntryDocument = HydratedDocument<KhataEntry>;

export enum KhataEntryType {
  /** Goods given on credit — the balance goes up. */
  Credit = 'CREDIT',
  /** Cash/UPI received from the customer — the balance comes down. */
  Payment = 'PAYMENT',
}

/**
 * One line in a shop's udhaar (credit) book.
 *
 * Nearly every kirana in a town runs on a paper khata: goods now, payment on
 * salary day. Digitising that — with the customer able to see the same number
 * on their phone — removes the single biggest source of shop-customer disputes,
 * and it works whether or not the sale came through the app.
 *
 * The customer is keyed by phone number, not by an account, because most khata
 * customers will never install anything. If they do sign up with the same
 * number, their history is already there.
 */
@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class KhataEntry {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Store', required: true })
  store: Types.ObjectId;

  @Prop({ required: true })
  customerName: string;

  // Normalised to the last 10 digits so "+91 98…" and "098…" are one person.
  @Prop({ required: true, index: true })
  customerPhone: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  customerUser: Types.ObjectId | null;

  @Prop({ type: String, enum: KhataEntryType, required: true })
  type: KhataEntryType;

  @Prop({ required: true })
  amount: number;

  // "5kg atta + tel", "diwali advance", "paid via UPI"
  @Prop({ default: '' })
  note: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order', default: null })
  order: Types.ObjectId | null;

  // Owner or counter staff who wrote this line.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId | null;

  // Back-dated entries are normal — a shopkeeper catches up on the book weekly.
  @Prop({ default: Date.now })
  at: Date;
}

export const KhataEntrySchema = SchemaFactory.createForClass(KhataEntry);
KhataEntrySchema.index({ store: 1, customerPhone: 1, at: -1 });

/** Keeps one customer's ledger together however their number was typed. */
export function normalisePhone(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}
