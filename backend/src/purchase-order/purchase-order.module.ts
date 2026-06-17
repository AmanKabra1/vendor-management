// src/purchase-order/purchase-order.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { Vendor } from '../vendor/vendor.entity';
import { PerformanceModule } from '../performance/performance.module';

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseOrder, Vendor]), PerformanceModule],
  providers: [PurchaseOrderService],
  controllers: [PurchaseOrderController],
})
export class PurchaseOrderModule {}
