import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Rider, RiderSchema } from './rider.entity';
import { RiderService } from './rider.service';
import { RiderController } from './rider.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rider.name, schema: RiderSchema }]),
  ],
  providers: [RiderService],
  controllers: [RiderController],
  exports: [RiderService],
})
export class RiderModule {}
