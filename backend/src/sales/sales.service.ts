import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadDocument, LeadStatus } from './lead.entity';
import { CreateLeadDto, LogVisitDto, UpdateLeadDto } from './dto/lead.dto';
import { StoreService } from '../store/store.service';
import { AuthUser } from '../auth/current-user.decorator';
import { Role } from '../auth/role.enum';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
    private readonly stores: StoreService,
  ) {}

  private isAdmin(user: AuthUser) {
    return user.role === Role.SuperAdmin || user.role === Role.Admin;
  }

  create(dto: CreateLeadDto, user: AuthUser) {
    return this.leadModel.create({
      ...dto,
      agent: user.userId,
      nextFollowUp: dto.nextFollowUp ? new Date(dto.nextFollowUp) : null,
    });
  }

  /** An agent sees their own beat; an admin sees the whole field team. */
  findAll(user: AuthUser, status?: string) {
    const filter: Record<string, any> = this.isAdmin(user)
      ? {}
      : { agent: user.userId };
    if (status) filter.status = status.toUpperCase();
    return this.leadModel
      .find(filter)
      .populate('agent', 'name phone')
      .populate('store', 'name status')
      .sort({ nextFollowUp: 1, updatedAt: -1 })
      .limit(300)
      .exec();
  }

  private async owned(id: string, user: AuthUser) {
    const lead = await this.leadModel.findById(id).exec();
    if (!lead) throw new NotFoundException('Lead not found');
    if (!this.isAdmin(user) && String(lead.agent) !== user.userId) {
      throw new ForbiddenException('Not your lead');
    }
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, user: AuthUser) {
    const lead = await this.owned(id, user);
    const { nextFollowUp, ...rest } = dto;
    Object.assign(lead, rest);
    if (nextFollowUp !== undefined) {
      lead.nextFollowUp = nextFollowUp ? new Date(nextFollowUp) : (null as any);
    }
    await lead.save();
    return lead;
  }

  /** Log a shop visit — the unit of work for a field agent. */
  async logVisit(id: string, dto: LogVisitDto, user: AuthUser) {
    const lead = await this.owned(id, user);
    lead.visits.push({
      at: new Date(),
      note: dto.note ?? '',
      outcome: dto.status ?? lead.status,
    } as any);
    if (dto.status) lead.status = dto.status;
    if (dto.nextFollowUp) lead.nextFollowUp = new Date(dto.nextFollowUp);
    await lead.save();
    return lead;
  }

  async remove(id: string, user: AuthUser) {
    const lead = await this.owned(id, user);
    await lead.deleteOne();
    return { ok: true };
  }

  /**
   * The agent's scorecard: pipeline by stage, follow-ups due, and the shops
   * that actually went live — the only number that should pay a commission.
   */
  async stats(user: AuthUser) {
    const leads = await this.findAll(user);
    const byStatus: Record<string, number> = {};
    for (const l of leads) byStatus[l.status] = (byStatus[l.status] || 0) + 1;

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const followUpsDue = leads.filter(
      (l) =>
        l.nextFollowUp &&
        new Date(l.nextFollowUp) <= today &&
        ![
          LeadStatus.Onboarded,
          LeadStatus.NotInterested,
          LeadStatus.Closed,
        ].includes(l.status),
    );

    const onboardedStores = this.isAdmin(user)
      ? []
      : await this.stores.onboardedBy(user.userId);
    const liveStores = onboardedStores.filter((s) => s.status === 'APPROVED');

    return {
      total: leads.length,
      byStatus,
      followUpsDue: followUpsDue.length,
      followUpList: followUpsDue.slice(0, 10),
      shopsOnboarded: onboardedStores.length,
      shopsLive: liveStores.length,
      // Shown as an estimate only; the real payout is settled by the admin.
      estimatedIncentive: liveStores.length * 200,
    };
  }

  /** Links a lead to the store it became, once the shopkeeper registers. */
  async attachStore(id: string, storeId: string, user: AuthUser) {
    const lead = await this.owned(id, user);
    lead.store = storeId as any;
    lead.status = LeadStatus.Onboarded;
    await lead.save();
    return lead;
  }
}
