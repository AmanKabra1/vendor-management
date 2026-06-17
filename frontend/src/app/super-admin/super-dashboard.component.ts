import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';

@Component({
  selector: 'app-super-dashboard',
  standalone: false,
  template: `
    <h3 class="mb-4">Admin Console</h3>

    <div class="row g-3 mb-4">
      <div class="col-6 col-lg-3" *ngFor="let s of statCards">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <div class="text-muted small">{{ s.label }}</div>
            <div class="display-6 fw-bold">{{ s.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <!-- Pending stores -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-white fw-semibold d-flex justify-content-between">
            <span>Stores awaiting approval</span>
            <span class="badge bg-warning text-dark">{{ pendingStores.length }}</span>
          </div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let s of pendingStores">
              <div>
                <div class="fw-semibold">{{ s.name }}</div>
                <small class="text-muted">{{ s.category }} · {{ s.address?.city || '—' }}</small>
              </div>
              <div>
                <button class="btn btn-sm btn-success me-1" (click)="approveStore(s)">Approve</button>
                <button class="btn btn-sm btn-outline-danger" (click)="rejectStore(s)">Reject</button>
              </div>
            </li>
            <li class="list-group-item text-muted text-center" *ngIf="!pendingStores.length">No pending stores.</li>
          </ul>
        </div>
      </div>

      <!-- Pending riders -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-white fw-semibold d-flex justify-content-between">
            <span>Riders awaiting approval</span>
            <span class="badge bg-warning text-dark">{{ pendingRiders.length }}</span>
          </div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let r of pendingRiders">
              <div>
                <div class="fw-semibold">{{ r.user?.name || 'Rider' }}</div>
                <small class="text-muted">{{ r.vehicleType }} · {{ r.user?.email }}</small>
              </div>
              <button class="btn btn-sm btn-success" (click)="approveRider(r)">Approve</button>
            </li>
            <li class="list-group-item text-muted text-center" *ngIf="!pendingRiders.length">No pending riders.</li>
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class SuperDashboardComponent implements OnInit {
  stores: any[] = [];
  riders: any[] = [];
  orderStats: any = { total: 0, byStatus: {} };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.get('stores').subscribe((s) => (this.stores = s));
    this.api.get('riders').subscribe((r) => (this.riders = r));
    this.api.get('orders/stats').subscribe((s) => (this.orderStats = s));
  }

  get pendingStores() {
    return this.stores.filter((s) => s.status === 'PENDING');
  }
  get pendingRiders() {
    return this.riders.filter((r) => !r.isApproved);
  }

  get statCards() {
    return [
      { label: 'Stores', value: this.stores.length },
      { label: 'Riders', value: this.riders.length },
      { label: 'Orders', value: this.orderStats.total },
      { label: 'Delivered', value: this.orderStats.byStatus?.DELIVERED || 0 },
    ];
  }

  approveStore(s: any) {
    this.api.patch(`stores/${s.id}/approve`).subscribe(() => this.load());
  }
  rejectStore(s: any) {
    const reason = prompt('Reason for rejection?') || '';
    this.api.patch(`stores/${s.id}/reject`, { reason }).subscribe(() => this.load());
  }
  approveRider(r: any) {
    this.api.patch(`riders/${r.id}/approve`).subscribe(() => this.load());
  }
}
