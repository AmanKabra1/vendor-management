import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { UserDocument } from '../user/user.entity';
import { Vendor, VendorDocument } from '../vendor/vendor.entity';
import { Role, APPROVAL_REQUIRED_ROLES } from './role.enum';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { NotificationService } from '../notification/notification.service';

// Legacy vendor-management role gets an auto-created Vendor profile on register.
// Store owners instead create a Store via POST /stores after registering.
const VENDOR_BACKED_ROLES: Role[] = [Role.Vendor];

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<VendorDocument>,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Public self-registration. Accepts StoreOwner / Rider / Customer roles;
   * anything else falls back to the legacy Vendor flow. SuperAdmin / Admin are
   * seeded internally and can never be created here.
   */
  async register(dto: RegisterDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Resolve the requested role; default to legacy Vendor. Block privileged roles.
    const requested = dto.role;
    const role =
      requested && requested !== Role.SuperAdmin && requested !== Role.Admin
        ? requested
        : Role.Vendor;

    // Store-backed roles get a Vendor profile (created or linked via code).
    let vendorId: VendorDocument['_id'] | null = null;
    if (VENDOR_BACKED_ROLES.includes(role)) {
      let vendor: VendorDocument | null = null;
      if (dto.vendorCode) {
        vendor = await this.vendorModel
          .findOne({ vendorCode: dto.vendorCode })
          .exec();
        if (!vendor) {
          throw new ConflictException('No vendor found with that code');
        }
      } else {
        vendor = await this.vendorModel.create({
          name: dto.name,
          contactDetails: dto.email,
          address: '',
          vendorCode: await this.generateVendorCode(),
        });
      }
      vendorId = vendor._id;
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.create({
      email: dto.email,
      password: hash,
      name: dto.name,
      phone: dto.phone ?? '',
      landline: dto.landline ?? '',
      role,
      // Store owners & riders await SuperAdmin approval; others are auto-approved.
      isApproved: !APPROVAL_REQUIRED_ROLES.includes(role),
      vendor: vendorId,
    });

    this.notifications.welcome(user.email, user.name, role);
    return this.sign(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.sign(user);
  }

  private sign(user: UserDocument) {
    const vendorId = user.vendor ? String(user.vendor) : null;
    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      vendorId,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        isApproved: user.isApproved,
        vendorId,
      },
    };
  }

  private async generateVendorCode(): Promise<string> {
    const count = await this.vendorModel.countDocuments().exec();
    let n = count + 1;
    // Ensure uniqueness even if records were deleted.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const code = `V${String(n).padStart(3, '0')}`;
      const clash = await this.vendorModel
        .findOne({ vendorCode: code })
        .exec();
      if (!clash) return code;
      n++;
    }
  }
}
