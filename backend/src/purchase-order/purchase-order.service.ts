// src/purchase-order/purchase-order.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from './purchase-order.entity';
import { Vendor, VendorDocument } from '../vendor/vendor.entity';
import { PerformanceService } from '../performance/performance.service';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectModel(PurchaseOrder.name)
    private readonly poModel: Model<PurchaseOrderDocument>,
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<VendorDocument>,
    private readonly performanceService: PerformanceService,
  ) {}

  async create(data: any) {
    const saved = await this.poModel.create(data);
    await this.recalculateMetrics(String(data.vendor));
    return saved;
  }

  findAll(vendorId?: string) {
    const filter = vendorId ? { vendor: vendorId } : {};
    return this.poModel.find(filter).populate('vendor').exec();
  }

  findOne(id: string) {
    return this.poModel.findById(id).populate('vendor').exec();
  }

  async update(id: string, data: any) {
    const po = await this.poModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!po) throw new NotFoundException(`PO with id ${id} not found`);
    await this.recalculateMetrics(String(po.vendor));
    return po;
  }

  async delete(id: string) {
    const po = await this.poModel.findByIdAndDelete(id).exec();
    if (!po) throw new NotFoundException(`PO with id ${id} not found`);
    await this.recalculateMetrics(String(po.vendor));
  }

  async acknowledge(id: string) {
    const po = await this.poModel.findById(id).exec();
    if (!po) throw new NotFoundException();
    po.acknowledgmentDate = new Date();
    await po.save();
    await this.recalculateMetrics(String(po.vendor));
    return po;
  }

  async recalculateMetrics(vendorId: string) {
    const vendor = await this.vendorModel.findById(vendorId).exec();
    if (!vendor) throw new NotFoundException(`Vendor ${vendorId} not found`);

    const orders = await this.poModel.find({ vendor: vendorId }).exec();

    const completed = orders.filter((o) => o.status === 'completed');
    const onTime = completed.filter(
      (o) => o.deliveryDate && new Date(o.deliveryDate) <= new Date(),
    );

    vendor.onTimeDeliveryRate = completed.length
      ? (onTime.length / completed.length) * 100
      : 0;

    const qualityRated = completed.filter((o) => o.qualityRating != null);
    vendor.qualityRatingAvg = qualityRated.length
      ? qualityRated.reduce((sum, o) => sum + o.qualityRating, 0) /
        qualityRated.length
      : 0;

    const acknowledged = orders.filter((o) => o.acknowledgmentDate);
    vendor.averageResponseTime = acknowledged.length
      ? acknowledged.reduce(
          (sum, o) =>
            sum +
            (new Date(o.acknowledgmentDate).getTime() -
              new Date(o.issueDate).getTime()),
          0,
        ) /
        acknowledged.length /
        (1000 * 60 * 60)
      : 0;

    vendor.fulfillmentRate = orders.length
      ? completed.length / orders.length
      : 0;

    await vendor.save();
    await this.performanceService.recordSnapshot(vendor);
  }
}
