// src/performance/performance.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HistoricalPerformance } from './performance.entity';
import { Repository } from 'typeorm';
import { Vendor } from '../vendor/vendor.entity';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(HistoricalPerformance)
    private readonly historyRepo: Repository<HistoricalPerformance>,
  ) {}

  async recordSnapshot(vendor: Vendor) {
    const snapshot = this.historyRepo.create({
      vendor,
      date: new Date(),
      onTimeDeliveryRate: vendor.onTimeDeliveryRate,
      qualityRatingAvg: vendor.qualityRatingAvg,
      averageResponseTime: vendor.averageResponseTime,
      fulfillmentRate: vendor.fulfillmentRate,
    });
    return this.historyRepo.save(snapshot);
  }

  async getHistory(vendorId: number) {
    return this.historyRepo.find({ where: { vendor: { id: vendorId } } });
  }
}
