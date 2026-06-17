import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Vendor } from '../vendor/vendor.entity';

@Entity()
export class HistoricalPerformance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vendor, { eager: true })
  vendor: Vendor;

  @Column()
  date: Date;

  @Column('float')
  onTimeDeliveryRate: number;

  @Column('float')
  qualityRatingAvg: number;

  @Column('float')
  averageResponseTime: number;

  @Column('float')
  fulfillmentRate: number;
}
