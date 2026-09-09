import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Refill, RefillSchema } from './refill.entity';
import { RefillService } from './refill.service';
import { RefillController } from './refill.controller';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Refill.name, schema: RefillSchema }]),
    StoreModule,
  ],
  providers: [RefillService],
  controllers: [RefillController],
  exports: [RefillService],
})
export class RefillModule {}
