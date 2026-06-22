import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthUser } from '../auth/current-user.decorator';

// Verhoeff checksum tables — real Aadhaar numbers satisfy this, random 12-digit don't.
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(private readonly users: UserService) {}

  private verhoeffValid(num: string): boolean {
    let c = 0;
    const rev = num.split('').reverse();
    for (let i = 0; i < rev.length; i++) {
      c = D[c][P[i % 8][parseInt(rev[i], 10)]];
    }
    return c === 0;
  }

  /**
   * Verify an Aadhaar number and mark the user KYC-verified.
   * Validates format + Verhoeff checksum (the real Aadhaar rule). With no eKYC
   * provider configured this auto-approves (sandbox/mock); a licensed provider
   * (Cashfree / Setu / DigiLocker) can be slotted in here later.
   */
  async verifyAadhaar(aadhaarRaw: string, user: AuthUser) {
    const aadhaar = (aadhaarRaw || '').replace(/\s+/g, '');
    if (!/^\d{12}$/.test(aadhaar)) {
      throw new BadRequestException('Aadhaar must be 12 digits');
    }
    if (!this.verhoeffValid(aadhaar)) {
      throw new BadRequestException('Invalid Aadhaar number (checksum failed)');
    }

    // TODO: when AADHAAR_PROVIDER keys exist, call the provider here instead of auto-approving.
    const masked = `XXXX XXXX ${aadhaar.slice(-4)}`;
    await this.users.markVerified(user.userId, masked);
    this.logger.log(`KYC verified for user ${user.userId} (${masked})`);
    return { verified: true, aadhaarMasked: masked };
  }
}
