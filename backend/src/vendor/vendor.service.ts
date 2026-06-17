// src/vendor/vendor.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vendor } from './vendor.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
  ) {}

  async create(data: Partial<Vendor>) {
    const vendor = this.vendorRepo.create(data);
    return this.vendorRepo.save(vendor);
  }

  findAll() {
    return this.vendorRepo.find();
  }

  findOne(id: number) {
    return this.vendorRepo.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<Vendor>) {
    await this.vendorRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.vendorRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException();
  }

  async getPerformance(id: number) {
    const vendor = await this.vendorRepo.findOne({ where: { id } });
    if (!vendor) throw new NotFoundException();
    return {
      onTimeDeliveryRate: vendor.onTimeDeliveryRate,
      qualityRatingAvg: vendor.qualityRatingAvg,
      averageResponseTime: vendor.averageResponseTime,
      fulfillmentRate: vendor.fulfillmentRate,
    };
  }
}
