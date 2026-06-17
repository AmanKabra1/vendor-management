import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type HistoricalPerformanceDocument =
  HydratedDocument<HistoricalPerformance>;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class HistoricalPerformance {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Vendor', required: true })
  vendor: Types.ObjectId;

  @Prop()
  date: Date;

  @Prop()
  onTimeDeliveryRate: number;

  @Prop()
  qualityRatingAvg: number;

  @Prop()
  averageResponseTime: number;

  @Prop()
  fulfillmentRate: number;
}

export const HistoricalPerformanceSchema = SchemaFactory.createForClass(
  HistoricalPerformance,
);
