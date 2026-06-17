import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { Vendor } from '../vendor/vendor.entity';
import { Role } from './role.enum';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
  ) {}

  /**
   * Self-registration always creates a Vendor-role account, backed by a new
   * Vendor record (or linked to an existing one via vendorCode). Admins are
   * seeded / created internally, never via this public endpoint.
   */
  async register(dto: RegisterDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    let vendor: Vendor | null = null;
    if (dto.vendorCode) {
      vendor = await this.vendorRepo.findOne({
        where: { vendorCode: dto.vendorCode },
      });
      if (!vendor) {
        throw new ConflictException('No vendor found with that code');
      }
    } else {
      // Create a fresh vendor profile for this account.
      vendor = this.vendorRepo.create({
        name: dto.name,
        contactDetails: dto.email,
        address: '',
        vendorCode: await this.generateVendorCode(),
      });
      vendor = await this.vendorRepo.save(vendor);
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.create({
      email: dto.email,
      password: hash,
      name: dto.name,
      role: Role.Vendor,
      vendor,
    });

    return this.sign(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.sign(user);
  }

  private sign(user: User) {
    const vendorId = user.vendor ? user.vendor.id : null;
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      vendorId,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        vendorId,
      },
    };
  }

  private async generateVendorCode(): Promise<string> {
    const count = await this.vendorRepo.count();
    let n = count + 1;
    // Ensure uniqueness even if records were deleted.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const code = `V${String(n).padStart(3, '0')}`;
      const clash = await this.vendorRepo.findOne({
        where: { vendorCode: code },
      });
      if (!clash) return code;
      n++;
    }
  }
}
