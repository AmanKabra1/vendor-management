import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Rider,
  RiderDocument,
  Availability,
  RiderDocType,
} from './rider.entity';
import { AuthUser } from '../auth/current-user.decorator';
import { Role } from '../auth/role.enum';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class RiderService {
  constructor(
    @InjectModel(Rider.name) private readonly riderModel: Model<RiderDocument>,
    private readonly users: UserService,
    private readonly notifications: NotificationService,
  ) {}

  private isPlatformAdmin(user: AuthUser) {
    return user.role === Role.SuperAdmin || user.role === Role.Admin;
  }

  async register(dto: Partial<Rider>, userId: string) {
    const existing = await this.riderModel.findOne({ user: userId }).exec();
    if (existing) {
      throw new ConflictException('Rider profile already exists');
    }
    return this.riderModel.create({ ...dto, user: userId });
  }

  findAll(user: AuthUser) {
    const filter = this.isPlatformAdmin(user) ? {} : { user: user.userId };
    return this.riderModel.find(filter).populate('user', 'name email phone').exec();
  }

  /** Load a rider and enforce who may see it. */
  async findOne(id: string, user: AuthUser) {
    const rider = await this.riderModel
      .findById(id)
      .populate('user', 'name email phone')
      .exec();
    if (!rider) throw new NotFoundException('Rider not found');

    const isOwner = String(rider.user?._id ?? rider.user) === user.userId;
    const isDiscoverable =
      rider.isApproved &&
      (user.role === Role.StoreOwner || user.role === Role.Vendor);

    if (!this.isPlatformAdmin(user) && !isOwner && !isDiscoverable) {
      throw new ForbiddenException('Not allowed to view this rider');
    }
    return rider;
  }

  /** Fetch a rider the current user is allowed to MUTATE (owner or admin). */
  private async getOwned(id: string, user: AuthUser) {
    const rider = await this.riderModel.findById(id).exec();
    if (!rider) throw new NotFoundException('Rider not found');
    if (
      !this.isPlatformAdmin(user) &&
      String(rider.user) !== user.userId
    ) {
      throw new ForbiddenException('Not your rider profile');
    }
    return rider;
  }

  async update(id: string, dto: Partial<Rider>, user: AuthUser) {
    const rider = await this.getOwned(id, user);
    Object.assign(rider, dto);
    await rider.save();
    return rider;
  }

  async setAvailability(id: string, availability: Availability, user: AuthUser) {
    const rider = await this.getOwned(id, user);
    rider.availability = availability;
    await rider.save();
    return rider;
  }

  async setLocation(id: string, lat: number, lng: number, user: AuthUser) {
    const rider = await this.getOwned(id, user);
    rider.currentLocation = { type: 'Point', coordinates: [lng, lat] };
    await rider.save();
    return rider;
  }

  async getTimeSlots(id: string, user: AuthUser) {
    const rider = await this.getOwned(id, user);
    return rider.timeSlots;
  }

  async setTimeSlots(id: string, timeSlots: any[], user: AuthUser) {
    const rider = await this.getOwned(id, user);
    rider.timeSlots = timeSlots as any;
    await rider.save();
    return rider;
  }

  async approve(id: string) {
    const rider = await this.riderModel.findById(id).exec();
    if (!rider) throw new NotFoundException('Rider not found');
    rider.isApproved = true;
    await rider.save();
    const user = await this.users.findById(String(rider.user));
    if (user) this.notifications.approved(user.email, user.name, 'rider profile');
    return rider;
  }

  async verifyDocument(id: string, type: RiderDocType) {
    const rider = await this.riderModel.findById(id).exec();
    if (!rider) throw new NotFoundException('Rider not found');
    const doc = rider.documents.find((d) => d.type === type);
    if (!doc) throw new NotFoundException(`No ${type} document uploaded`);
    doc.verified = true;
    // Verified overall once every uploaded document is verified.
    rider.isVerified =
      rider.documents.length > 0 && rider.documents.every((d) => d.verified);
    await rider.save();
    return rider;
  }

  /** Approved riders matching an availability status near a point, nearest first. */
  nearby(
    lat: number,
    lng: number,
    radius = 5000,
    status: Availability = Availability.Available,
  ) {
    return this.riderModel
      .find({
        isApproved: true,
        availability: status,
        currentLocation: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radius,
          },
        },
      })
      .populate('user', 'name email phone')
      .exec();
  }
}
