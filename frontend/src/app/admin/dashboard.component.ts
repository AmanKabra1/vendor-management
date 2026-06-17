import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  template: `
    <h3 class="mb-4">Dashboard</h3>

    <div class="row g-3 mb-4">
      <div class="col-6 col-lg-3">
        <div class="card stat-card border-0 shadow-sm">
          <div class="card-body">
            <div class="text-muted small">Total Vendors</div>
            <div class="display-6 fw-bold">{{ vendors.length }}</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card stat-card border-0 shadow-sm">
          <div class="card-body">
            <div class="text-muted small">Purchase Orders</div>
            <div class="display-6 fw-bold">{{ orders.length }}</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card stat-card border-0 shadow-sm">
          <div class="card-body">
            <div class="text-muted small">Avg On-Time Delivery</div>
            <div class="display-6 fw-bold">{{ avgOnTime | number: '1.0-1' }}%</div>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card stat-card border-0 shadow-sm">
          <div class="card-body">
            <div class="text-muted small">Avg Quality Rating</div>
            <div class="display-6 fw-bold">{{ avgQuality | number: '1.0-2' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-header bg-white fw-semibold">Vendor Performance Overview</div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Vendor</th>
              <th>Code</th>
              <th>On-Time %</th>
              <th>Quality</th>
              <th>Response (hrs)</th>
              <th>Fulfillment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of vendors">
              <td class="fw-semibold">{{ v.name }}</td>
              <td>{{ v.vendorCode }}</td>
              <td>{{ v.onTimeDeliveryRate | number: '1.0-1' }}%</td>
              <td>{{ v.qualityRatingAvg | number: '1.0-2' }}</td>
              <td>{{ v.averageResponseTime | number: '1.0-1' }}</td>
              <td>{{ v.fulfillmentRate * 100 | number: '1.0-0' }}%</td>
              <td class="text-end">
                <a class="btn btn-sm btn-outline-primary" [routerLink]="['/admin/vendors', v.id]">View</a>
              </td>
            </tr>
            <tr *ngIf="!vendors.length">
              <td colspan="7" class="text-center text-muted py-4">No vendors yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  vendors: any[] = [];
  orders: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get('vendors').subscribe((v) => (this.vendors = v));
    this.api.get('purchase-orders').subscribe((o) => (this.orders = o));
  }

  get avgOnTime() {
    if (!this.vendors.length) return 0;
    return (
      this.vendors.reduce((s, v) => s + (v.onTimeDeliveryRate || 0), 0) /
      this.vendors.length
    );
  }

  get avgQuality() {
    if (!this.vendors.length) return 0;
    return (
      this.vendors.reduce((s, v) => s + (v.qualityRatingAvg || 0), 0) /
      this.vendors.length
    );
  }
}
