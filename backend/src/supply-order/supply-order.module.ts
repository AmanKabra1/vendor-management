import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SupplyOrder,
  SupplyOrderSchema,
} from './supply-order.entity';
import { SupplyOrderService } from './supply-order.service';
import { SupplyOrderController } from './supply-order.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupplyOrder.name, schema: SupplyOrderSchema },
    ]),
  ],
  providers: [SupplyOrderService],
  controllers: [SupplyOrderController],
})
export class SupplyOrderModule {}
