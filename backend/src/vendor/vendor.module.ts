// src/vendor/vendor.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vendor, VendorSchema } from './vendor.entity';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { PerformanceModule } from '../performance/performance.module';

const VendorFeature = MongooseModule.forFeature([
  { name: Vendor.name, schema: VendorSchema },
]);

@Module({
  imports: [VendorFeature, PerformanceModule],
  providers: [VendorService],
  controllers: [VendorController],
  // Export the model so other modules (auth, purchase-order) can inject it.
  exports: [VendorService, VendorFeature],
})
export class VendorModule {}
