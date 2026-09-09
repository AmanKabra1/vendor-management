import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  EmergencyContact,
  EmergencyContactDocument,
  EmergencyType,
  SosAlert,
  SosAlertDocument,
  SosStatus,
} from './emergency.entity';
import {
  CreateEmergencyContactDto,
  CreateSosDto,
  UpdateEmergencyContactDto,
} from './dto/emergency.dto';
import { NATIONAL_HELPLINES, SAFETY_TIPS } from './national-helplines';
import { AuthUser } from '../auth/current-user.decorator';

export interface DirectoryQuery {
  type?: string;
  city?: string;
  pincode?: string;
  area?: string;
  q?: string;
}

@Injectable()
export class EmergencyService {
  constructor(
    @InjectModel(EmergencyContact.name)
    private readonly contactModel: Model<EmergencyContactDocument>,
    @InjectModel(SosAlert.name)
    private readonly sosModel: Model<SosAlertDocument>,
  ) {}

  // ---------------------------------------------------------------- directory

  private toGeo(lat?: number, lng?: number) {
    return lat != null && lng != null
      ? { type: 'Point', coordinates: [lng, lat] }
      : undefined;
  }

  private filter(
    query: DirectoryQuery = {},
  ): FilterQuery<EmergencyContactDocument> {
    const filter: FilterQuery<EmergencyContactDocument> = { isActive: true };
    if (query.type) filter.type = query.type.toUpperCase();
    if (query.pincode) filter.pincode = query.pincode;
    if (query.city) filter.city = new RegExp(escapeRe(query.city), 'i');
    if (query.area) filter.area = new RegExp(escapeRe(query.area), 'i');
    if (query.q) {
      const re = new RegExp(escapeRe(query.q), 'i');
      filter.$or = [
        { name: re },
        { nameLocal: re },
        { notes: re },
        { address: re },
      ];
    }
    return filter;
  }

  /**
   * The whole emergency screen in one response: national helplines that always
   * work, plus the local numbers for this town. One round trip so the page
   * still renders on a 2G connection.
   */
  async directory(query: DirectoryQuery = {}) {
    const local = await this.contactModel
      .find(this.filter(query))
      .sort({ verified: -1, is24x7: -1, name: 1 })
      .limit(200)
      .exec();

    const helplines = query.type
      ? NATIONAL_HELPLINES.filter((h) => h.type === query.type!.toUpperCase())
      : NATIONAL_HELPLINES;

    return { national: helplines, local, safetyTips: SAFETY_TIPS };
  }

  /** Local contacts nearest to a point (falls back to an unsorted list). */
  async nearby(
    lat: number,
    lng: number,
    radius = 15000,
    query: DirectoryQuery = {},
  ) {
    const local = await this.contactModel
      .find({
        ...this.filter(query),
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radius,
          },
        },
      })
      .limit(60)
      .exec();
    return { national: NATIONAL_HELPLINES, local, safetyTips: SAFETY_TIPS };
  }

  /** Type keys with at least one local listing — used to build filter chips. */
  async typeCounts() {
    const rows = await this.contactModel.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r._id] = r.count;
    return counts;
  }

  // ------------------------------------------------------------ contact admin

  findAll(query: DirectoryQuery = {}) {
    return this.contactModel
      .find(this.filter(query))
      .sort({ createdAt: -1 })
      .limit(300)
      .exec();
  }

  async create(dto: CreateEmergencyContactDto, user: AuthUser) {
    const { lat, lng, ...rest } = dto;
    const location = this.toGeo(lat, lng);
    return this.contactModel.create({
      ...rest,
      ...(location ? { location } : {}),
      addedBy: user.userId,
    });
  }

  async update(id: string, dto: UpdateEmergencyContactDto) {
    const contact = await this.contactModel.findById(id).exec();
    if (!contact) throw new NotFoundException('Contact not found');
    const { lat, lng, ...rest } = dto;
    Object.assign(contact, rest);
    const location = this.toGeo(lat, lng);
    if (location) contact.location = location as any;
    await contact.save();
    return contact;
  }

  async remove(id: string) {
    const contact = await this.contactModel.findById(id).exec();
    if (!contact) throw new NotFoundException('Contact not found');
    contact.isActive = false;
    await contact.save();
    return { ok: true };
  }

  /** Idempotent bulk insert — used by the seeder for a district's numbers. */
  async seedContacts(rows: Partial<EmergencyContact>[]) {
    let added = 0;
    for (const row of rows) {
      const exists = await this.contactModel
        .findOne({ phone: row.phone, name: row.name })
        .exec();
      if (exists) continue;
      await this.contactModel.create(row);
      added++;
    }
    return added;
  }

  // -------------------------------------------------------------------- SOS

  async raiseSos(dto: CreateSosDto, user?: AuthUser) {
    const { lat, lng, ...rest } = dto;
    const location = this.toGeo(lat, lng);
    return this.sosModel.create({
      ...rest,
      type: dto.type ?? EmergencyType.Other,
      ...(location ? { location } : {}),
      raisedBy: user?.userId ?? null,
      status: SosStatus.Open,
    });
  }

  /** Open alerts, newest first — what a rider or shopkeeper sees to help. */
  openAlerts(limit = 30) {
    return this.sosModel
      .find({ status: { $in: [SosStatus.Open, SosStatus.Acknowledged] } })
      .populate('raisedBy', 'name phone')
      .populate('acknowledgedBy', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /** Open alerts near a responder, so a rider only sees what they can reach. */
  nearbyAlerts(lat: number, lng: number, radius = 10000) {
    return this.sosModel
      .find({
        status: { $in: [SosStatus.Open, SosStatus.Acknowledged] },
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radius,
          },
        },
      })
      .populate('raisedBy', 'name phone')
      .limit(30)
      .exec();
  }

  myAlerts(user: AuthUser) {
    return this.sosModel
      .find({ raisedBy: user.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();
  }

  async setSosStatus(id: string, status: SosStatus, user: AuthUser, note = '') {
    const alert = await this.sosModel.findById(id).exec();
    if (!alert) throw new NotFoundException('Alert not found');
    alert.status = status;
    if (note) alert.responseNote = note;
    if (status === SosStatus.Acknowledged) {
      alert.acknowledgedBy = user.userId as any;
    }
    if (status === SosStatus.Resolved || status === SosStatus.Cancelled) {
      alert.resolvedAt = new Date();
    }
    await alert.save();
    return alert;
  }
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
