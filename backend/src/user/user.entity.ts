import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../auth/role.enum';
import { Vendor } from '../vendor/vendor.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: Role.Vendor })
  role: Role;

  // For vendor users: links the account to its Vendor record.
  // Null for admins.
  @ManyToOne(() => Vendor, { nullable: true, eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  vendor: Vendor | null;
}
