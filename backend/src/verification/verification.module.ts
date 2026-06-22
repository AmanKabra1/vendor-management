import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';

// UserService is global, so no imports needed.
@Module({
  providers: [VerificationService],
  controllers: [VerificationController],
})
export class VerificationModule {}
