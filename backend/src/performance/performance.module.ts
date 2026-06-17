// src/performance/performance.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoricalPerformance } from './performance.entity';
import { PerformanceService } from './performance.service';

@Module({
  imports: [TypeOrmModule.forFeature([HistoricalPerformance])],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
