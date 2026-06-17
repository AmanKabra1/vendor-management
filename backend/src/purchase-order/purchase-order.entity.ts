// src/purchase-order/purchase-order.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Vendor } from '../vendor/vendor.entity';

@Entity()
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  poNumber: string;

  @ManyToOne(() => Vendor, (vendor) => vendor.purchaseOrders, { eager: true })
  vendor: Vendor;

  @Column()
  orderDate: Date;

  @Column({ nullable: true })
  deliveryDate: Date;

  @Column('simple-json')
  items: any;

  @Column()
  quantity: number;

  @Column()
  status: string;

  @Column({ type: 'float', nullable: true })
  qualityRating: number;

  @Column()
  issueDate: Date;

  @Column({ nullable: true })
  acknowledgmentDate: Date;
}
