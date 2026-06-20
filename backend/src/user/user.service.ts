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

  /** List users of given role(s) — used to discover suppliers (wholesalers/distributors). */
  findByRoles(roles: string[]) {
    return this.userModel
      .find({ role: { $in: roles } })
      .select('name email role phone')
      .exec();
  }
}
