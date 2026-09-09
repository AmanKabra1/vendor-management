import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { I18nService } from '../shared/i18n.service';
import { categoriesByGroup, categoryMeta } from '../shared/store-categories';

const STATUSES = [
  { key: 'NEW', en: 'New', hi: 'नया', tint: 'muted' },
  { key: 'VISITED', en: 'Visited', hi: 'दौरा किया', tint: 'info' },
  { key: 'INTERESTED', en: 'Interested', hi: 'रुचि है', tint: 'warn' },
  { key: 'DEMO_GIVEN', en: 'Demo given', hi: 'डेमो दिया', tint: 'info' },
  { key: 'ONBOARDED', en: 'Onboarded', hi: 'जुड़ गई', tint: 'ok' },
  { key: 'NOT_INTERESTED', en: 'Not interested', hi: 'मना किया', tint: 'danger' },
  { key: 'CLOSED', en: 'Closed', hi: 'बंद', tint: 'muted' },
];

/**
 * The field sales agent's screen.
 *
 * Small-town shops don't sign up from an advert — someone walks in with a phone,
 * shows the shopkeeper their own khata on it, and comes back twice. This is that
 * beat: shops visited, what they said, and who to call back today.
 */
@Component({
  selector: 'app-sales-dashboard',
  standalone: false,
  template: `
    <div class="rf-page-head">
      <div class="rf-eyebrow">{{ 'sales.title' | t }}</div>
      <h3>{{ 'sales.pipeline' | t }}</h3>
    </div>

    <!-- Scorecard -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-lg-3">
        <div class="card stat-card h-100"><div class="card-body">
          <div class="rf-eyebrow">{{ 'sales.pipeline' | t }}</div>
          <div class="display-6">{{ stats?.total || 0 }}</div>
        </div></div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card stat-card h-100"><div class="card-body">
          <div class="rf-eyebrow">{{ 'sales.followUps' | t }}</div>
          <div class="display-6">{{ stats?.followUpsDue || 0 }}</div>
        </div></div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card stat-card h-100"><div class="card-body">
          <div class="rf-eyebrow">{{ 'sales.live' | t }}</div>
          <div class="display-6">{{ stats?.shopsLive || 0 }}</div>
          <div class="small text-muted">{{ stats?.shopsOnboarded || 0 }} {{ 'sales.onboarded' | t }}</div>
        </div></div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card stat-card h-100"><div class="card-body">
          <div class="rf-eyebrow">{{ 'sales.incentive' | t }}</div>
          <div class="display-6">₹{{ stats?.estimatedIncentive || 0 }}</div>
          <div class="small text-muted">
            {{ i18n.lang() === 'hi' ? 'अनुमान — भुगतान एडमिन तय करेगा' : 'Estimate — admin settles the payout' }}
          </div>
        </div></div>
      </div>
    </div>

    <div class="row g-4">
      <!-- Add a shop the agent just walked into -->
      <div class="col-lg-4">
        <div class="card">
          <div class="card-header">➕ {{ 'sales.addLead' | t }}</div>
          <div class="card-body">
            <input class="form-control mb-2" [placeholder]="'nav.shops' | t"
                   [(ngModel)]="form.shopName" name="lname">
            <input class="form-control mb-2" [placeholder]="'common.name' | t"
                   [(ngModel)]="form.ownerName" name="loname">
            <input class="form-control mb-2" [placeholder]="'common.phone' | t" inputmode="numeric"
                   [(ngModel)]="form.phone" name="lphone">

            <label class="form-label">{{ 'dir.allTypes' | t }}</label>
            <select class="form-select mb-2" [(ngModel)]="form.category" name="lcat">
              <optgroup *ngFor="let g of groups" [label]="g.group">
                <option *ngFor="let c of g.items" [value]="c.key">
                  {{ c.icon }} {{ i18n.pick(c.en, c.hi) }}
                </option>
              </optgroup>
            </select>

            <div class="row g-2 mb-2">
              <div class="col-6">
                <input class="form-control" [placeholder]="'common.area' | t"
                       [(ngModel)]="form.area" name="larea">
              </div>
              <div class="col-6">
                <input class="form-control" [placeholder]="'common.pincode' | t" inputmode="numeric"
                       [(ngModel)]="form.pincode" name="lpin">
              </div>
            </div>
            <input class="form-control mb-2" [placeholder]="'common.landmark' | t"
                   [(ngModel)]="form.landmark" name="llm">
            <textarea class="form-control mb-2" rows="2" [placeholder]="'common.note' | t"
                      [(ngModel)]="form.notes" name="lnotes"></textarea>
            <label class="form-label">{{ 'sales.followUps' | t }}</label>
            <input type="date" class="form-control mb-2" [(ngModel)]="form.nextFollowUp" name="lfu">

            <button class="btn btn-primary w-100" (click)="add()" [disabled]="!form.shopName.trim()">
              {{ 'common.save' | t }}
            </button>
          </div>
        </div>
      </div>

      <!-- Pipeline -->
      <div class="col-lg-8">
        <div class="rf-chips-scroll mb-3">
          <button class="rf-chip" [class.active]="!filter" (click)="setFilter('')">
            {{ 'common.all' | t }} ({{ leads.length }})
          </button>
          <button class="rf-chip" *ngFor="let s of statuses" [class.active]="filter === s.key"
                  (click)="setFilter(s.key)">
            {{ i18n.pick(s.en, s.hi) }}
            <span class="text-muted" *ngIf="stats?.byStatus?.[s.key]">{{ stats.byStatus[s.key] }}</span>
          </button>
        </div>

        <div class="rf-empty" *ngIf="!leads.length">
          <span class="rf-empty-ic">📋</span>{{ 'common.none' | t }}
        </div>

        <div class="card mb-2" *ngFor="let l of leads">
          <div class="card-body py-3">
            <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
              <div>
                <div class="fw-bold">
                  {{ meta(l.category).icon }} {{ l.shopName }}
                  <span class="rf-pill ms-1" [ngClass]="tintFor(l.status)">
                    {{ statusLabel(l.status) }}
                  </span>
                </div>
                <div class="small text-muted">
                  {{ [l.ownerName, l.area, l.city, l.pincode] | rfJoin }}
                </div>
                <div class="small text-muted" *ngIf="l.landmark">📍 {{ l.landmark }}</div>
                <div class="small" *ngIf="l.nextFollowUp"
                     [class.text-danger]="isDue(l.nextFollowUp)">
                  🔔 {{ l.nextFollowUp | date: 'mediumDate' }}
                </div>
                <div class="small text-muted mt-1" *ngIf="l.notes">{{ l.notes }}</div>
              </div>

              <div class="d-flex flex-column gap-1 align-items-end">
                <a class="btn btn-sm btn-call" *ngIf="l.phone" [href]="'tel:' + l.phone">
                  📞 {{ 'common.call' | t }}
                </a>
                <a class="btn btn-sm btn-wa" *ngIf="l.phone" [href]="waLink(l)" target="_blank"
                   rel="noopener">{{ 'common.whatsapp' | t }}</a>
                <button class="btn btn-sm btn-outline-primary"
                        (click)="visiting = visiting === l.id ? null : l.id">
                  📝 {{ 'sales.logVisit' | t }}
                </button>
              </div>
            </div>

            <!-- Log a visit: status + note + when to come back. -->
            <div class="row g-2 mt-2 pt-2 border-top" *ngIf="visiting === l.id">
              <div class="col-md-4">
                <select class="form-select" [(ngModel)]="visit.status" [name]="'vs' + l.id">
                  <option *ngFor="let s of statuses" [value]="s.key">{{ statusLabel(s.key) }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <input class="form-control" [placeholder]="'common.note' | t"
                       [(ngModel)]="visit.note" [name]="'vn' + l.id">
              </div>
              <div class="col-md-3">
                <input type="date" class="form-control" [(ngModel)]="visit.nextFollowUp"
                       [name]="'vf' + l.id">
              </div>
              <div class="col-md-1 d-grid">
                <button class="btn btn-primary" (click)="logVisit(l)">✓</button>
              </div>

              <div class="col-12" *ngIf="l.visits?.length">
                <div class="small text-muted" *ngFor="let v of l.visits.slice().reverse()">
                  · {{ v.at | date: 'dd MMM' }} — {{ statusLabel(v.outcome) }}
                  <span *ngIf="v.note">: {{ v.note }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SalesDashboardComponent implements OnInit {
  leads: any[] = [];
  stats: any = null;
  statuses = STATUSES;
  filter = '';
  visiting: string | null = null;
  groups = categoriesByGroup().filter((g) => g.items.length);
  meta = categoryMeta;

  form = {
    shopName: '',
    ownerName: '',
    phone: '',
    category: 'KIRANA',
    area: '',
    city: '',
    pincode: '',
    landmark: '',
    notes: '',
    nextFollowUp: '',
  };

  visit = { status: 'VISITED', note: '', nextFollowUp: '' };

  constructor(private api: ApiService, public i18n: I18nService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    const q = this.filter ? `?status=${this.filter}` : '';
    this.api.get(`sales/leads${q}`).subscribe({
      next: (l: any) => (this.leads = (l || []).map((x: any) => ({ ...x, id: x.id ?? x._id }))),
      error: () => (this.leads = []),
    });
    this.api.get('sales/stats').subscribe({
      next: (s: any) => (this.stats = s),
      error: () => {},
    });
  }

  setFilter(key: string) {
    this.filter = this.filter === key ? '' : key;
    this.load();
  }

  add() {
    this.api
      .post('sales/leads', {
        ...this.form,
        nextFollowUp: this.form.nextFollowUp
          ? new Date(this.form.nextFollowUp).toISOString()
          : undefined,
      })
      .subscribe(() => {
        this.form = {
          shopName: '', ownerName: '', phone: '', category: 'KIRANA', area: '', city: '',
          pincode: '', landmark: '', notes: '', nextFollowUp: '',
        };
        this.load();
      });
  }

  logVisit(l: any) {
    this.api
      .post(`sales/leads/${l.id}/visit`, {
        status: this.visit.status,
        note: this.visit.note,
        nextFollowUp: this.visit.nextFollowUp
          ? new Date(this.visit.nextFollowUp).toISOString()
          : undefined,
      })
      .subscribe(() => {
        this.visiting = null;
        this.visit = { status: 'VISITED', note: '', nextFollowUp: '' };
        this.load();
      });
  }

  statusLabel(key: string): string {
    const s = this.statuses.find((x) => x.key === key);
    return s ? this.i18n.pick(s.en, s.hi) : key;
  }

  tintFor(key: string): string {
    return this.statuses.find((x) => x.key === key)?.tint || 'muted';
  }

  isDue(date: string): boolean {
    return new Date(date) <= new Date();
  }

  /** A pitch message the agent can fire off between two shops. */
  waLink(l: any): string {
    const msg =
      this.i18n.lang() === 'hi'
        ? `नमस्ते ${l.ownerName || l.shopName}, RideFleet से — आपकी दुकान के ऑर्डर, उधार खाता और डिलीवरी एक ही ऐप में। मुफ़्त है।`
        : `Hello ${l.ownerName || l.shopName}, this is RideFleet — orders, udhaar khata and delivery for your shop in one app. Free to start.`;
    const digits = String(l.phone || '').replace(/\D/g, '');
    return `https://wa.me/91${digits.slice(-10)}?text=${encodeURIComponent(msg)}`;
  }
}
