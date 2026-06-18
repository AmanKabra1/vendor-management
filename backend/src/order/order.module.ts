import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './order.entity';
import { Store, StoreSchema } from '../store/store.entity';
import { Rider, RiderSchema } from '../rider/rider.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PublicTrackingController } from './public-tracking.controller';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      // Re-registered here so OrderService can update store/rider counters.
      { name: Store.name, schema: StoreSchema },
      { name: Rider.name, schema: RiderSchema },
    ]),
    TrackingModule,
  ],
  providers: [OrderService],
  controllers: [OrderController, PublicTrackingController],
  exports: [OrderService],
})
export class OrderModule {}
