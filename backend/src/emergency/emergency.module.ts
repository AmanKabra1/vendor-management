import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmergencyContact,
  EmergencyContactSchema,
  SosAlert,
  SosAlertSchema,
} from './emergency.entity';
import { EmergencyService } from './emergency.service';
import { EmergencyController } from './emergency.controller';
import { PublicEmergencyController } from './public-emergency.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmergencyContact.name, schema: EmergencyContactSchema },
      { name: SosAlert.name, schema: SosAlertSchema },
    ]),
  ],
  providers: [EmergencyService],
  controllers: [EmergencyController, PublicEmergencyController],
  exports: [EmergencyService],
})
export class EmergencyModule {}
