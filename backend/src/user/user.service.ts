import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.entity';

/** The only fields a user may change about their own account. */
export interface ProfileFields {
  name?: string;
  phone?: string;
  landline?: string;
  avatar?: string;
  preferredLanguage?: string;
  address?: Record<string, unknown>;
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  /**
   * Look a user up by mobile number, matching on the last 10 digits so
   * "+91 98765 43210", "098765 43210" and "9876543210" all find the same
   * person. Phone is how customers are identified in a town — many will never
   * have an email address that they actually check.
   */
  findByPhone(phone: string) {
    const digits = String(phone || '').replace(/\D/g, '');
    const last10 = digits.length > 10 ? digits.slice(-10) : digits;
    if (last10.length < 10) return Promise.resolve(null);
    return this.userModel.findOne({ phone: { $regex: `${last10}$` } }).exec();
  }

  /** Counter-staff accounts attached to one shop. */
  findStaffForStore(storeId: string) {
    return this.userModel
      .find({ store: storeId })
      .select('name email phone role isActive createdAt')
      .exec();
  }

  /**
   * Self-service profile update. Allow-listed field by field so a caller can
   * never promote themselves by posting `role` or `isApproved` to /me.
   */
  updateProfile(id: string, data: ProfileFields) {
    const allowed: ProfileFields = {};
    if (data.name !== undefined) allowed.name = data.name;
    if (data.phone !== undefined) allowed.phone = data.phone;
    if (data.landline !== undefined) allowed.landline = data.landline;
    if (data.avatar !== undefined) allowed.avatar = data.avatar;
    if (data.preferredLanguage !== undefined) {
      allowed.preferredLanguage = data.preferredLanguage;
    }
    if (data.address !== undefined) allowed.address = data.address;

    return this.userModel
      .findByIdAndUpdate(id, allowed, { new: true })
      .select('-password')
      .exec();
  }

  create(data: Partial<User>) {
    return this.userModel.create(data);
  }

  count() {
    return this.userModel.countDocuments().exec();
  }

  /** Mark a user identity-verified after successful KYC. */
  markVerified(id: string, aadhaarMasked: string) {
    return this.userModel
      .findByIdAndUpdate(id, { isVerified: true, aadhaarMasked }, { new: true })
      .exec();
  }

  /**
   * List users of given role(s) — used to discover suppliers (wholesalers/distributors).
   * Pass approvedOnly=true so buyers only see admin-approved suppliers.
   */
  findByRoles(roles: string[], approvedOnly = false) {
    const filter: Record<string, unknown> = { role: { $in: roles } };
    if (approvedOnly) filter.isApproved = true;
    return this.userModel.find(filter).select('name email role phone').exec();
  }

  /** Full supplier list for the admin console, including approval status. */
  findSuppliersForAdmin(roles: string[]) {
    return this.userModel
      .find({ role: { $in: roles } })
      .select('name email role phone isApproved isActive createdAt')
      .sort({ createdAt: -1 })
      .exec();
  }

  /** SuperAdmin approves/rejects a user account (gates suppliers, store owners…). */
  setApproval(id: string, approved: boolean) {
    return this.userModel
      .findByIdAndUpdate(id, { isApproved: approved }, { new: true })
      .exec();
  }
}
