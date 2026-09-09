import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type LeadDocument = HydratedDocument<Lead>;

export enum LeadStatus {
  New = 'NEW',
  Visited = 'VISITED',
  Interested = 'INTERESTED',
  DemoGiven = 'DEMO_GIVEN',
  Onboarded = 'ONBOARDED',
  NotInterested = 'NOT_INTERESTED',
  Closed = 'CLOSED',
}

@Schema({ _id: false })
export class LeadVisit {
  @Prop({ default: Date.now })
  at: Date;

  @Prop({ default: '' })
  note: string;

  // Status the lead moved to at this visit.
  @Prop({ default: '' })
  outcome: string;
}
const LeadVisitSchema = SchemaFactory.createForClass(LeadVisit);

/**
 * A shop a field agent is working on.
 *
 * Small-town shops don't sign up from an ad — somebody walks in, shows them the
 * app on a phone, and comes back twice. This is that pipeline: who was visited,
 * what they said, when to return. It's also how a sales agent's work is
 * credited, since an onboarded shop links back to the agent.
 */
@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Lead {
  // The field sales agent who owns this lead.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  agent: Types.ObjectId;

  @Prop({ required: true })
  shopName: string;

  @Prop({ default: '' })
  ownerName: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: 'KIRANA' })
  category: string;

  @Prop({ default: '' })
  area: string;

  @Prop({ default: '' })
  city: string;

  @Prop({ default: '' })
  pincode: string;

  @Prop({ default: '' })
  landmark: string;

  @Prop({ type: String, enum: LeadStatus, default: LeadStatus.New })
  status: LeadStatus;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: null })
  nextFollowUp: Date;

  @Prop({ type: [LeadVisitSchema], default: [] })
  visits: LeadVisit[];

  // Set once the shop actually registers and creates its store.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Store', default: null })
  store: Types.ObjectId | null;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
LeadSchema.index({ agent: 1, status: 1, nextFollowUp: 1 });
