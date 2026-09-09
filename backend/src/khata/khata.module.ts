import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KhataEntry, KhataEntrySchema } from './khata.entity';
import { KhataService } from './khata.service';
import { KhataController } from './khata.controller';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KhataEntry.name, schema: KhataEntrySchema },
    ]),
    StoreModule,
  ],
  providers: [KhataService],
  controllers: [KhataController],
  exports: [KhataService],
})
export class KhataModule {}
