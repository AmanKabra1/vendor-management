// src/vendor/vendor.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from './vendor.entity';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { PerformanceModule } from 'src/performance/performance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor]),
    PerformanceModule
  ],
  providers: [VendorService],
  controllers: [VendorController],
  exports: [VendorService],
})
export class VendorModule {}
