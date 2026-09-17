import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../shared/api.service';
import { I18nService } from '../shared/i18n.service';

@Component({
  selector: 'app-vendor-detail',
  standalone: false,
  template: `
    <a routerLink="/admin/vendors" class="text-decoration-none">&larr; {{ 'admin.manageVendors' | t }}</a>

    <div *ngIf="vendor" class="mt-2">
      <div class="d-flex align-items-center gap-3 mb-4">
        <h3 class="mb-0">{{ vendor.name }}</h3>
        <span class="badge bg-secondary">{{ vendor.vendorCode }}</span>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3" *ngFor="let m of metricCards">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="text-muted small">{{ m.label }}</div>
              <div class="h4 fw-bold mb-2">{{ m.display }}</div>
              <div class="progress" style="height:6px">
                <div class="progress-bar" [style.width.%]="m.pct" [ngClass]="m.cls"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white fw-semibold">{{ 'vendor.onTimeHistory' | t }}</div>
            <div class="card-body">
              <div *ngIf="history.length; else noHist" class="vchart">
                <!-- y-axis reference lines -->
                <div class="vchart-grid">
                  <span *ngFor="let g of [100, 75, 50, 25, 0]">{{ g }}</span>
                </div>
                <div class="vchart-plot">
                  <div class="vgrid-line" *ngFor="let g of [0,1,2,3]"></div>
                  <div class="vbar-col" *ngFor="let h of history; let i = index">
                    <div class="vbar-val">{{ (h.onTimeDeliveryRate || 0) | number:'1.0-0' }}%</div>
                    <div class="vbar" [style.height.%]="clamp(h.onTimeDeliveryRate)"
                         [title]="(h.onTimeDeliveryRate | number:'1.0-1') + '%'"></div>
                    <div class="vbar-x">{{ h.createdAt ? (h.createdAt | date:'dd MMM') : ('#' + (i + 1)) }}</div>
                  </div>
                </div>
              </div>
              <p class="text-muted small mt-2 mb-0">{{ 'vendor.historyNote' | t }}</p>
              <ng-template #noHist>
                <p class="text-muted mb-0">{{ 'vendor.noHistory' | t }}</p>
              </ng-template>
            </div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white fw-semibold">{{ 'shop.contact' | t }}</div>
            <div class="card-body">
              <p class="mb-1"><strong>{{ 'common.phone' | t }}:</strong> {{ vendor.contactDetails }}</p>
              <p class="mb-1"><strong>{{ 'admin.eAddress' | t }}:</strong> {{ vendor.address || '—' }}</p>
              <p class="mb-0"><strong>{{ 'vendor.snapshots' | t }}:</strong> {{ history.length }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `.vchart { display: flex; gap: 8px; height: 200px; }`,
    // y-axis labels
    `.vchart-grid { display: flex; flex-direction: column; justify-content: space-between;
       font-size: .7rem; color: #94a3b8; padding-bottom: 22px; }`,
    // plot area with gridlines
    `.vchart-plot { position: relative; flex: 1; display: flex; align-items: flex-end;
       justify-content: flex-start; gap: 14px; padding: 0 8px 22px; }`,
    `.vgrid-line { position: absolute; left: 0; right: 0; border-top: 1px dashed #eceaf3; }`,
    `.vgrid-line:nth-child(1) { top: 0; } .vgrid-line:nth-child(2) { top: 25%; }
     .vgrid-line:nth-child(3) { top: 50%; } .vgrid-line:nth-child(4) { top: 75%; }`,
    // one bar
    `.vbar-col { position: relative; width: 46px; height: 100%; display: flex; flex-direction: column;
       align-items: center; justify-content: flex-end; z-index: 1; }`,
    `.vbar-val { font-size: .72rem; font-weight: 700; color: #5b21b6; margin-bottom: 3px; }`,
    `.vbar { width: 100%; background: linear-gradient(180deg,#7c3aed,#4f46e5); border-radius: 6px 6px 0 0;
       min-height: 3px; box-shadow: 0 4px 12px rgba(124,58,237,.25); transition: height .35s ease; }`,
    `.vbar-x { position: absolute; bottom: -20px; font-size: .68rem; color: #94a3b8; white-space: nowrap; }`,
  ],
})
export class VendorDetailComponent implements OnInit {
  vendor: any;
  history: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public i18n: I18nService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get(`vendors/${id}`).subscribe((v) => (this.vendor = v));
    this.api
      .get(`vendors/${id}/performance-history`)
      .subscribe((h) => (this.history = h || []));
  }

  /** A bar must be visible even at 0%, so give it a small floor. */
  clamp(v: number) {
    const n = Number(v) || 0;
    return Math.max(2, Math.min(100, n));
  }

  /** Percentages may be stored 0-1 (fraction) or 0-100 — normalise to 0-100. */
  private pctOf(v: number) {
    const n = Number(v) || 0;
    return n <= 1 ? n * 100 : n;
  }

  get metricCards() {
    const v = this.vendor;
    if (!v) return [];
    const pick = (en: string, hi: string) => this.i18n.pick(en, hi);
    return [
      {
        label: pick('On-Time Delivery', 'समय पर डिलीवरी'),
        display: (Number(v.onTimeDeliveryRate) || 0).toFixed(1) + '%',
        pct: Math.min(100, Number(v.onTimeDeliveryRate) || 0),
        cls: 'bg-success',
      },
      {
        label: pick('Quality Rating', 'गुणवत्ता रेटिंग'),
        display: (Number(v.qualityRatingAvg) || 0).toFixed(2) + ' / 5',
        pct: ((Number(v.qualityRatingAvg) || 0) / 5) * 100,
        cls: 'bg-info',
      },
      {
        label: pick('Avg Response (hrs)', 'औसत जवाब (घंटे)'),
        display: (Number(v.averageResponseTime) || 0).toFixed(1),
        pct: Math.min(100, (Number(v.averageResponseTime) || 0) * 5),
        cls: 'bg-warning',
      },
      {
        label: pick('Fulfillment Rate', 'पूर्ति दर'),
        display: this.pctOf(v.fulfillmentRate).toFixed(0) + '%',
        pct: this.pctOf(v.fulfillmentRate),
        cls: 'bg-primary',
      },
    ];
  }
}
