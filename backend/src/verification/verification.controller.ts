import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('verification')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Post('aadhaar')
  aadhaar(@Body('aadhaar') aadhaar: string, @CurrentUser() user: AuthUser) {
    return this.verification.verifyAadhaar(aadhaar, user);
  }
}
