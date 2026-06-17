// src/performance/performance.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HistoricalPerformance,
  HistoricalPerformanceSchema,
} from './performance.entity';
import { PerformanceService } from './performance.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: HistoricalPerformance.name,
        schema: HistoricalPerformanceSchema,
      },
    ]),
  ],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
