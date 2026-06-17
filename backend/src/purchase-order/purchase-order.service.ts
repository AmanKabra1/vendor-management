// src/purchase-order/purchase-order.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { Repository } from 'typeorm';
import { Vendor } from '../vendor/vendor.entity';
import { PerformanceService } from 'src/performance/performance.service';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,

    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,

    private readonly performanceService: PerformanceService, // Assuming you have a PerformanceService to handle historical performance
  ) { }

  async create(data: any) {
    const po = this.poRepo.create(data);
    const saved = await this.poRepo.save(po);
    await this.recalculateMetrics(data.vendor);
    return saved;
  }

  findAll(vendorId?: number) {
    return this.poRepo.find({
      where: vendorId ? { vendor: { id: vendorId } } : {},
    });
  }

  findOne(id: number) {
    return this.poRepo.findOne({ where: { id } });
  }

  async update(id: number, data: any) {
    await this.poRepo.update(id, data);
    const po = await this.findOne(id);
    if (!po) throw new NotFoundException(`PO with id ${id} not found`);
    await this.recalculateMetrics(po.vendor.id);
    return po;
  }

  async delete(id: number) {
    const po = await this.findOne(id);
    await this.poRepo.delete(id);
    if (!po) throw new NotFoundException(`PO with id ${id} not found`);
    await this.recalculateMetrics(po.vendor.id);
  }

  async acknowledge(id: number) {
    const po = await this.findOne(id);
    if (!po) throw new NotFoundException();
    po.acknowledgmentDate = new Date();
    await this.poRepo.save(po);
    await this.recalculateMetrics(po.vendor.id);
  }

  async recalculateMetrics(vendorId: number) {
    const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException(`Vendor with id ${vendorId} not found`);

    const orders = await this.poRepo.find({ where: { vendor: { id: vendorId } } });

    const completed = orders.filter((o) => o.status === 'completed');
    const onTime = completed.filter((o) => o.deliveryDate && new Date(o.deliveryDate) <= new Date());

    vendor.onTimeDeliveryRate = completed.length ? (onTime.length / completed.length) * 100 : 0;

    const qualityRated = completed.filter((o) => o.qualityRating != null);
    vendor.qualityRatingAvg = qualityRated.length
      ? qualityRated.reduce((sum, o) => sum + o.qualityRating, 0) / qualityRated.length
      : 0;

    const acknowledged = orders.filter((o) => o.acknowledgmentDate);
    vendor.averageResponseTime = acknowledged.length
      ? acknowledged.reduce((sum, o) =>
        sum + (new Date(o.acknowledgmentDate).getTime() - new Date(o.issueDate).getTime())
        , 0) / acknowledged.length / (1000 * 60 * 60)
      : 0;

    vendor.fulfillmentRate = orders.length
      ? completed.length / orders.length
      : 0;

    await this.vendorRepo.save(vendor);
    await this.performanceService.recordSnapshot(vendor);
  }

}
