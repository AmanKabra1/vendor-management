import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-my-performance',
  standalone: false,
  template: `
    <h3 class="mb-4">My Performance</h3>

    <div *ngIf="vendor" class="row g-3 mb-4">
      <div class="col-md-3" *ngFor="let m of metricCards">
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

    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white fw-semibold">On-Time Delivery History</div>
      <div class="card-body">
        <div *ngIf="history.length; else noHist" class="chart">
          <div class="bar-col" *ngFor="let h of history">
            <div class="bar" [style.height.%]="h.onTimeDeliveryRate" [title]="(h.onTimeDeliveryRate | number:'1.0-1') + '%'"></div>
          </div>
        </div>
        <ng-template #noHist>
          <p class="text-muted mb-0">No history yet — your metrics will appear here as orders are processed.</p>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `.chart { display: flex; align-items: flex-end; gap: 4px; height: 180px; border-bottom: 2px solid #dee2e6; padding-top: 8px; }`,
    `.bar-col { flex: 1; display: flex; align-items: flex-end; height: 100%; }`,
    `.bar { width: 100%; background: linear-gradient(180deg,#0d6efd,#6ea8fe); border-radius: 3px 3px 0 0; min-height: 2px; }`,
  ],
})
export class MyPerformanceComponent implements OnInit {
  vendor: any;
  history: any[] = [];

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    const id = this.auth.currentUser?.vendorId;
    if (!id) return;
    this.api.get(`vendors/${id}`).subscribe((v) => (this.vendor = v));
    this.api
      .get(`vendors/${id}/performance-history`)
      .subscribe((h) => (this.history = h));
  }

  get metricCards() {
    const v = this.vendor;
    if (!v) return [];
    return [
      { label: 'On-Time Delivery', display: (v.onTimeDeliveryRate ?? 0).toFixed(1) + '%', pct: v.onTimeDeliveryRate ?? 0, cls: 'bg-success' },
      { label: 'Quality Rating', display: (v.qualityRatingAvg ?? 0).toFixed(2) + ' / 5', pct: ((v.qualityRatingAvg ?? 0) / 5) * 100, cls: 'bg-info' },
      { label: 'Avg Response (hrs)', display: (v.averageResponseTime ?? 0).toFixed(1), pct: Math.min(100, v.averageResponseTime ?? 0), cls: 'bg-warning' },
      { label: 'Fulfillment Rate', display: ((v.fulfillmentRate ?? 0) * 100).toFixed(0) + '%', pct: (v.fulfillmentRate ?? 0) * 100, cls: 'bg-primary' },
    ];
  }
}
