import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { VendorModule } from './vendor/vendor.module';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { PerformanceModule } from './performance/performance.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { StoreModule } from './store/store.module';
import { RiderModule } from './rider/rider.module';
import { OrderModule } from './order/order.module';
import { ChatModule } from './chat/chat.module';
import { ProductModule } from './product/product.module';
import { SupplyOrderModule } from './supply-order/supply-order.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      // Atlas in production via DATABASE_URL; local MongoDB for development.
      process.env.DATABASE_URL ||
        'mongodb://127.0.0.1:27017/vendor_management',
    ),
    UserModule,
    NotificationModule,
    AuthModule,
    StoreModule,
    RiderModule,
    OrderModule,
    ChatModule,
    ProductModule,
    SupplyOrderModule,
    VendorModule,
    PurchaseOrderModule,
    PerformanceModule,
  ],
})
export class AppModule {}
