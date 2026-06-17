// src/performance/performance.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HistoricalPerformance,
  HistoricalPerformanceDocument,
} from './performance.entity';
import { VendorDocument } from '../vendor/vendor.entity';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(HistoricalPerformance.name)
    private readonly historyModel: Model<HistoricalPerformanceDocument>,
  ) {}

  recordSnapshot(vendor: VendorDocument) {
    return this.historyModel.create({
      vendor: vendor._id,
      date: new Date(),
      onTimeDeliveryRate: vendor.onTimeDeliveryRate,
      qualityRatingAvg: vendor.qualityRatingAvg,
      averageResponseTime: vendor.averageResponseTime,
      fulfillmentRate: vendor.fulfillmentRate,
    });
  }

  getHistory(vendorId: string) {
    return this.historyModel
      .find({ vendor: vendorId })
      .sort({ date: 1 })
      .exec();
  }
}
