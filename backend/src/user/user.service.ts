import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.entity';

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
