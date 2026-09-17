// src/vendor/vendor.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Vendor, VendorDocument } from './vendor.entity';
import { UserService } from '../user/user.service';
import { Role } from '../auth/role.enum';

@Injectable()
export class VendorService {
  constructor(
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<VendorDocument>,
    private readonly users: UserService,
  ) {}

  create(data: Partial<Vendor>) {
    return this.vendorModel.create(data);
  }

  /**
   * Admin creates a login for a vendor: a User (role vendor) linked to the
   * vendor record, so the vendor can sign in and work their purchase orders.
   * The vendor is approved on creation (the admin is vouching for them).
   */
  async createLogin(
    vendorId: string,
    data: { email: string; password: string; name?: string },
  ) {
    const vendor = await this.vendorModel.findById(vendorId).exec();
    if (!vendor) throw new NotFoundException('Vendor not found');
    if (!data.email || !data.password) {
      throw new BadRequestException('Email and password are required');
    }
    const existing = await this.users.findByEmail(data.email.toLowerCase());
    if (existing) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(data.password, 10);
    const user = await this.users.create({
      email: data.email.toLowerCase(),
      password: hash,
      name: data.name || vendor.name,
      role: Role.Vendor,
      isApproved: true,
      isVerified: true,
      vendor: vendor._id as any,
    });
    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      vendorCode: vendor.vendorCode,
    };
  }

  findAll() {
    return this.vendorModel.find().exec();
  }

  findOne(id: string) {
    return this.vendorModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Vendor>) {
    const vendor = await this.vendorModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!vendor) throw new NotFoundException();
    return vendor;
  }

  async remove(id: string) {
    const result = await this.vendorModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException();
  }

  async getPerformance(id: string) {
    const vendor = await this.vendorModel.findById(id).exec();
    if (!vendor) throw new NotFoundException();
    return {
      onTimeDeliveryRate: vendor.onTimeDeliveryRate,
      qualityRatingAvg: vendor.qualityRatingAvg,
      averageResponseTime: vendor.averageResponseTime,
      fulfillmentRate: vendor.fulfillmentRate,
    };
  }
}
