import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';

type Tab = 'overview' | 'stores' | 'riders' | 'orders' | 'vendors';

@Component({
  selector: 'app-super-dashboard',
  standalone: false,
  template: `
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h3 class="mb-0">Admin Console</h3>
      <span class="badge bg-secondary">Platform Administrator</span>
    </div>

    <!-- stat cards -->
    <div class="row g-3 mb-3">
      <div class="col-6 col-lg-3" *ngFor="let s of statCards">
        <div class="card stat-card border-0">
          <div class="card-body">
            <div class="text-muted small">{{ s.label }}</div>
            <div class="display-6">{{ s.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- tabs -->
    <ul class="nav nav-pills gap-2 mb-3">
      <li class="nav-item" *ngFor="let t of tabs">
        <a class="nav-link" [class.active]="tab===t.key" (click)="tab=t.key" role="button">
          {{ t.label }}
          <span class="badge bg-warning text-dark ms-1" *ngIf="t.key==='stores' && pendingStores.length">{{ pendingStores.length }}</span>
          <span class="badge bg-warning text-dark ms-1" *ngIf="t.key==='riders' && pendingRiders.length">{{ pendingRiders.length }}</span>
        </a>
      </li>
    </ul>

    <!-- OVERVIEW -->
    <div *ngIf="tab==='overview'" class="row g-4">
      <div class="col-lg-6">
        <div class="card border-0 h-100">
          <div class="card-header d-flex justify-content-between"><span>Stores awaiting approval</span><span class="badge bg-warning text-dark">{{ pendingStores.length }}</span></div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let s of pendingStores">
              <div><div class="fw-semibold">{{ s.name }}</div><small class="text-muted">{{ s.category }} · {{ s.address?.city || '—' }}</small></div>
              <div><button class="btn btn-sm btn-success me-1" (click)="approveStore(s)">Approve</button><button class="btn btn-sm btn-outline-danger" (click)="rejectStore(s)">Reject</button></div>
            </li>
            <li class="list-group-item text-muted text-center" *ngIf="!pendingStores.length">All clear 🎉</li>
          </ul>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card border-0 h-100">
          <div class="card-header d-flex justify-content-between"><span>Riders awaiting approval</span><span class="badge bg-warning text-dark">{{ pendingRiders.length }}</span></div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let r of pendingRiders">
              <div><div class="fw-semibold">{{ r.user?.name || 'Rider' }}</div><small class="text-muted">{{ r.vehicleType }} · {{ r.user?.email }}</small></div>
              <button class="btn btn-sm btn-success" (click)="approveRider(r)">Approve</button>
            </li>
            <li class="list-group-item text-muted text-center" *ngIf="!pendingRiders.length">All clear 🎉</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- STORES -->
    <div *ngIf="tab==='stores'" class="card border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>Store</th><th>Category</th><th>City</th><th>Status</th><th>Orders</th><th class="text-end">Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let s of stores">
              <td class="fw-semibold">{{ s.name }}</td><td>{{ s.category }}</td><td>{{ s.address?.city || '—' }}</td>
              <td><span class="badge" [ngClass]="s.status==='APPROVED'?'bg-success':(s.status==='REJECTED'?'bg-danger':'bg-warning text-dark')">{{ s.status }}</span></td>
              <td>{{ s.totalOrders }}</td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-success me-1" *ngIf="s.status!=='APPROVED'" (click)="approveStore(s)">Approve</button>
                <button class="btn btn-sm btn-outline-danger" *ngIf="s.status!=='REJECTED'" (click)="rejectStore(s)">Reject</button>
              </td>
            </tr>
            <tr *ngIf="!stores.length"><td colspan="6" class="text-center text-muted py-3">No stores.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- RIDERS -->
    <div *ngIf="tab==='riders'" class="card border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>Rider</th><th>Vehicle</th><th>Availability</th><th>Deliveries</th><th>Status</th><th class="text-end">Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of riders">
              <td class="fw-semibold">{{ r.user?.name || 'Rider' }}<div class="small text-muted">{{ r.user?.email }}</div></td>
              <td>{{ r.vehicleType }}</td><td><span class="badge bg-light text-dark">{{ r.availability }}</span></td><td>{{ r.totalDeliveries }}</td>
              <td><span class="badge" [ngClass]="r.isApproved?'bg-success':'bg-warning text-dark'">{{ r.isApproved?'Approved':'Pending' }}</span></td>
              <td class="text-end"><button class="btn btn-sm btn-success" *ngIf="!r.isApproved" (click)="approveRider(r)">Approve</button></td>
            </tr>
            <tr *ngIf="!riders.length"><td colspan="6" class="text-center text-muted py-3">No riders.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ORDERS -->
    <div *ngIf="tab==='orders'" class="card border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>Order #</th><th>Store</th><th>Rider</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            <tr *ngFor="let o of orders">
              <td class="fw-semibold small">{{ o.orderNumber }}</td><td>{{ o.store?.name || '—' }}</td><td>{{ o.rider?.user?.name || '—' }}</td>
              <td>₹{{ o.totalAmount }}</td><td><span class="badge bg-secondary">{{ o.status }}</span></td>
            </tr>
            <tr *ngIf="!orders.length"><td colspan="5" class="text-center text-muted py-3">No orders.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- VENDORS (legacy procurement) -->
    <div *ngIf="tab==='vendors'" class="card border-0">
      <div class="card-header d-flex justify-content-between">
        <span>Procurement vendors (legacy)</span>
        <span>
          <a class="btn btn-sm btn-outline-primary me-1" routerLink="/admin/vendors">Manage vendors</a>
          <a class="btn btn-sm btn-outline-secondary" routerLink="/admin/purchase-orders">Purchase orders</a>
        </span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>Name</th><th>Code</th><th>On-Time</th><th>Quality</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let v of vendors">
              <td class="fw-semibold">{{ v.name }}</td><td>{{ v.vendorCode }}</td>
              <td>{{ v.onTimeDeliveryRate | number:'1.0-1' }}%</td><td>{{ v.qualityRatingAvg | number:'1.0-2' }}</td>
              <td class="text-end"><a class="btn btn-sm btn-outline-secondary" [routerLink]="['/admin/vendors', v.id]">View</a></td>
            </tr>
            <tr *ngIf="!vendors.length"><td colspan="5" class="text-center text-muted py-3">No vendors.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class SuperDashboardComponent implements OnInit {
  tab: Tab = 'overview';
  tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'stores', label: 'Stores' },
    { key: 'riders', label: 'Riders' },
    { key: 'orders', label: 'Orders' },
    { key: 'vendors', label: 'Vendors' },
  ];

  stores: any[] = [];
  riders: any[] = [];
  orders: any[] = [];
  vendors: any[] = [];
  orderStats: any = { total: 0, byStatus: {} };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.get('stores').subscribe((s) => (this.stores = s));
    this.api.get('riders').subscribe((r) => (this.riders = r));
    this.api.get('orders').subscribe((o) => (this.orders = o));
    this.api.get('orders/stats').subscribe((s) => (this.orderStats = s));
    this.api.get('vendors').subscribe((v) => (this.vendors = v));
  }

  get pendingStores() { return this.stores.filter((s) => s.status === 'PENDING'); }
  get pendingRiders() { return this.riders.filter((r) => !r.isApproved); }

  get statCards() {
    return [
      { label: 'Stores', value: this.stores.length },
      { label: 'Riders', value: this.riders.length },
      { label: 'Orders', value: this.orderStats.total },
      { label: 'Delivered', value: this.orderStats.byStatus?.DELIVERED || 0 },
    ];
  }

  approveStore(s: any) { this.api.patch(`stores/${s.id}/approve`).subscribe(() => this.load()); }
  rejectStore(s: any) {
    const reason = prompt('Reason for rejection?') || '';
    this.api.patch(`stores/${s.id}/reject`, { reason }).subscribe(() => this.load());
  }
  approveRider(r: any) { this.api.patch(`riders/${r.id}/approve`).subscribe(() => this.load()); }
}
