import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type RefillDocument = HydratedDocument<Refill>;

export enum RefillFrequency {
  Daily = 'DAILY',
  AlternateDay = 'ALTERNATE_DAY',
  Weekly = 'WEEKLY',
  Fortnightly = 'FORTNIGHTLY',
  Monthly = 'MONTHLY',
  OnDemand = 'ON_DEMAND',
}

/** Days added to the next date once a refill is delivered. */
export const FREQUENCY_DAYS: Record<RefillFrequency, number> = {
  [RefillFrequency.Daily]: 1,
  [RefillFrequency.AlternateDay]: 2,
  [RefillFrequency.Weekly]: 7,
  [RefillFrequency.Fortnightly]: 15,
  [RefillFrequency.Monthly]: 30,
  [RefillFrequency.OnDemand]: 0,
};

/**
 * A standing order for something a household needs again and again: the 20-litre
 * water can, the LPG cylinder, the morning milk, cattle feed.
 *
 * These are the highest-frequency purchases in a town and today they run on a
 * phone call and the supplier's memory. A dated list the shop can work through
 * each morning is more useful here than any recommendation engine — and it means
 * the customer never runs out of drinking water because they forgot to call.
 */
@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Refill {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  customerUser: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Store', required: true })
  store: Types.ObjectId;

  // "20L water can", "Indane 14.2kg cylinder", "Milk 1L full cream"
  @Prop({ required: true })
  itemLabel: string;

  // Mirrors the store category so the customer app can group these.
  @Prop({ default: 'WATER' })
  category: string;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ default: 'unit' })
  unit: string;

  @Prop({ default: 0 })
  expectedPrice: number;

  @Prop({
    type: String,
    enum: RefillFrequency,
    default: RefillFrequency.Weekly,
  })
  frequency: RefillFrequency;

  // The date the shop should deliver next. Drives the "due today" list.
  @Prop({ default: Date.now })
  nextDate: Date;

  @Prop({ default: '' })
  customerName: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  address: string;

  @Prop({ default: '' })
  landmark: string;

  // Preferred window: "morning", "6-8 pm" — households are out during the day.
  @Prop({ default: '' })
  preferredTime: string;

  @Prop({ default: '' })
  notes: string;

  // Paused instead of deleted — people travel, then come back.
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  lastDeliveredAt: Date;

  @Prop({ default: 0 })
  deliveredCount: number;
}

export const RefillSchema = SchemaFactory.createForClass(Refill);
RefillSchema.index({ store: 1, isActive: 1, nextDate: 1 });
RefillSchema.index({ customerUser: 1 });
