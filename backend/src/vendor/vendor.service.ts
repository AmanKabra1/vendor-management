// src/vendor/vendor.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vendor, VendorDocument } from './vendor.entity';

@Injectable()
export class VendorService {
  constructor(
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<VendorDocument>,
  ) {}

  create(data: Partial<Vendor>) {
    return this.vendorModel.create(data);
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
