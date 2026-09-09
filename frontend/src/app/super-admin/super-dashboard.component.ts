import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';

type Tab =
  | 'overview'
  | 'stores'
  | 'riders'
  | 'suppliers'
  | 'orders'
  | 'emergency'
  | 'vendors';

/** Emergency contact types an admin can file a local number under. */
const EMERGENCY_TYPES = [
  { key: 'AMBULANCE', label: '🚑 Ambulance' },
  { key: 'HOSPITAL', label: '🏥 Hospital' },
  { key: 'CHEMIST_24X7', label: '💊 24x7 chemist' },
  { key: 'BLOOD_BANK', label: '🩸 Blood bank' },
  { key: 'FIRE_BRIGADE', label: '🚒 Fire brigade' },
  { key: 'POLICE', label: '👮 Police' },
  { key: 'GAS_LEAK', label: '🔥 Gas leak' },
  { key: 'ELECTRICITY', label: '⚡ Electricity' },
  { key: 'WATER_TANKER', label: '🚰 Water tanker' },
  { key: 'VETERINARY', label: '🐄 Veterinary' },
  { key: 'WOMEN_HELPLINE', label: '👩 Women helpline' },
  { key: 'CHILD_HELPLINE', label: '🧒 Child helpline' },
  { key: 'DISASTER', label: '🌊 Disaster cell' },
  { key: 'MUNICIPALITY', label: '🏛️ Municipality' },
  { key: 'TOWING', label: '🛻 Towing' },
  { key: 'OTHER', label: '🆘 Other' },
];

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
          <span class="badge bg-warning text-dark ms-1" *ngIf="t.key==='suppliers' && pendingSuppliers.length">{{ pendingSuppliers.length }}</span>
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
      <div class="col-lg-6">
        <div class="card border-0 h-100">
          <div class="card-header d-flex justify-content-between"><span>Suppliers awaiting approval</span><span class="badge bg-warning text-dark">{{ pendingSuppliers.length }}</span></div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let u of pendingSuppliers">
              <div><div class="fw-semibold">{{ u.name }}</div><small class="text-muted">{{ u.role }} · {{ u.email }}</small></div>
              <div><button class="btn btn-sm btn-success me-1" (click)="approveSupplier(u)">Approve</button><button class="btn btn-sm btn-outline-danger" (click)="rejectSupplier(u)">Reject</button></div>
            </li>
            <li class="list-group-item text-muted text-center" *ngIf="!pendingSuppliers.length">All clear 🎉</li>
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

    <!-- SUPPLIERS (wholesalers & distributors) -->
    <div *ngIf="tab==='suppliers'" class="card border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Status</th><th class="text-end">Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let u of suppliers">
              <td class="fw-semibold">{{ u.name }}</td>
              <td><span class="badge bg-light text-dark text-capitalize">{{ u.role }}</span></td>
              <td>{{ u.email }}</td><td>{{ u.phone || '—' }}</td>
              <td><span class="badge" [ngClass]="u.isApproved?'bg-success':'bg-warning text-dark'">{{ u.isApproved?'Approved':'Pending' }}</span></td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-success me-1" *ngIf="!u.isApproved" (click)="approveSupplier(u)">Approve</button>
                <button class="btn btn-sm btn-outline-danger" *ngIf="u.isApproved" (click)="rejectSupplier(u)">Revoke</button>
              </td>
            </tr>
            <tr *ngIf="!suppliers.length"><td colspan="6" class="text-center text-muted py-3">No suppliers.</td></tr>
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

    <!-- EMERGENCY DIRECTORY ----------------------------------------------
         The national helplines are built into the app; this is where the
         district's own numbers get curated. Unverified entries (submitted by
         shopkeepers and field agents) are listed last on the public page until
         an admin confirms the number actually answers. -->
    <div *ngIf="tab==='emergency'" class="row g-4">
      <div class="col-lg-4">
        <div class="card">
          <div class="card-header">➕ Add a local emergency number</div>
          <div class="card-body">
            <label class="form-label">Type</label>
            <select class="form-select mb-2" [(ngModel)]="sosForm.type" name="etype">
              <option *ngFor="let t of emergencyTypes" [value]="t.key">{{ t.label }}</option>
            </select>
            <input class="form-control mb-2" placeholder="Name (e.g. Gupta Nursing Home)"
                   [(ngModel)]="sosForm.name" name="ename">
            <input class="form-control mb-2" placeholder="नाम (हिंदी में)"
                   [(ngModel)]="sosForm.nameLocal" name="enamel">
            <input class="form-control mb-2" placeholder="Phone" inputmode="numeric"
                   [(ngModel)]="sosForm.phone" name="ephone">
            <input class="form-control mb-2" placeholder="Alternate phone" inputmode="numeric"
                   [(ngModel)]="sosForm.altPhone" name="ealt">
            <input class="form-control mb-2" placeholder="Address / landmark"
                   [(ngModel)]="sosForm.address" name="eaddr">
            <div class="row g-2 mb-2">
              <div class="col-4"><input class="form-control" placeholder="Area"
                     [(ngModel)]="sosForm.area" name="earea"></div>
              <div class="col-4"><input class="form-control" placeholder="City"
                     [(ngModel)]="sosForm.city" name="ecity"></div>
              <div class="col-4"><input class="form-control" placeholder="Pincode" inputmode="numeric"
                     [(ngModel)]="sosForm.pincode" name="epin"></div>
            </div>
            <input class="form-control mb-2" placeholder="Notes (has oxygen, ICU van…)"
                   [(ngModel)]="sosForm.notes" name="enotes">
            <div class="form-check form-switch mb-2">
              <input class="form-check-input" type="checkbox" id="e24" [(ngModel)]="sosForm.is24x7"
                     name="e24">
              <label class="form-check-label" for="e24">Answers 24×7</label>
            </div>
            <button class="btn btn-primary w-100" (click)="addContact()"
                    [disabled]="!sosForm.name.trim() || !sosForm.phone.trim()">
              Add number
            </button>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <!-- Open help requests raised from the app -->
        <div class="card mb-3" *ngIf="alerts.length">
          <div class="card-header d-flex justify-content-between">
            <span>🆘 Open help requests</span>
            <span class="badge bg-danger">{{ alerts.length }}</span>
          </div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-start gap-2"
                *ngFor="let a of alerts">
              <span>
                <span class="fw-semibold">{{ a.type }}</span> — {{ a.message || '—' }}
                <small class="d-block text-muted">
                  {{ a.name || a.raisedBy?.name }} · {{ a.landmark }} ·
                  {{ a.createdAt | date: 'short' }}
                </small>
              </span>
              <span class="d-flex gap-1 flex-shrink-0">
                <a class="btn btn-sm btn-call" *ngIf="a.phone || a.raisedBy?.phone"
                   [href]="'tel:' + (a.phone || a.raisedBy?.phone)">📞</a>
                <button class="btn btn-sm btn-outline-success" (click)="resolveAlert(a)">Resolve</button>
              </span>
            </li>
          </ul>
        </div>

        <div class="card">
          <div class="card-header d-flex justify-content-between">
            <span>Local emergency directory</span>
            <span class="text-muted small">{{ contacts.length }}</span>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr><th>Type</th><th>Name</th><th>Phone</th><th>Area</th><th>Verified</th>
                  <th class="text-end">Actions</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of contacts">
                  <td class="small">{{ c.type }}</td>
                  <td class="fw-semibold">{{ c.name }}
                    <small class="d-block text-muted" *ngIf="c.notes">{{ c.notes }}</small>
                  </td>
                  <td><a [href]="'tel:' + c.phone">{{ c.phone }}</a></td>
                  <td class="small">{{ c.area || c.city || '—' }} {{ c.pincode }}</td>
                  <td>
                    <span class="badge" [ngClass]="c.verified ? 'bg-success' : 'bg-warning text-dark'">
                      {{ c.verified ? 'Verified' : 'Unverified' }}
                    </span>
                  </td>
                  <td class="text-end text-nowrap">
                    <button class="btn btn-sm btn-success me-1" *ngIf="!c.verified"
                            (click)="verifyContact(c)">Verify</button>
                    <button class="btn btn-sm btn-outline-danger"
                            (click)="removeContact(c)">Remove</button>
                  </td>
                </tr>
                <tr *ngIf="!contacts.length">
                  <td colspan="6" class="text-center text-muted py-3">
                    No local numbers yet — the national helplines still show on the public page.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
    { key: 'suppliers', label: 'Suppliers' },
    { key: 'orders', label: 'Orders' },
    { key: 'emergency', label: '🆘 Emergency' },
    { key: 'vendors', label: 'Vendors' },
  ];

  stores: any[] = [];
  riders: any[] = [];
  suppliers: any[] = [];
  orders: any[] = [];
  vendors: any[] = [];
  orderStats: any = { total: 0, byStatus: {} };

  // Emergency directory
  emergencyTypes = EMERGENCY_TYPES;
  contacts: any[] = [];
  alerts: any[] = [];
  sosForm = {
    type: 'AMBULANCE',
    name: '',
    nameLocal: '',
    phone: '',
    altPhone: '',
    address: '',
    area: '',
    city: '',
    pincode: '',
    notes: '',
    is24x7: true,
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.get('stores').subscribe((s) => (this.stores = s));
    this.api.get('riders').subscribe((r) => (this.riders = r));
    this.api.get('users/suppliers').subscribe((u) => (this.suppliers = u));
    this.api.get('orders').subscribe((o) => (this.orders = o));
    this.api.get('orders/stats').subscribe((s) => (this.orderStats = s));
    this.api.get('vendors').subscribe((v) => (this.vendors = v));
    this.loadEmergency();
  }

  // ------------------------------------------------------ emergency directory

  loadEmergency() {
    this.api.get('emergency').subscribe({
      next: (c: any) => (this.contacts = (c || []).map((x: any) => ({ ...x, id: x.id ?? x._id }))),
      error: () => (this.contacts = []),
    });
    this.api.get('emergency/sos').subscribe({
      next: (a: any) => (this.alerts = (a || []).map((x: any) => ({ ...x, id: x.id ?? x._id }))),
      error: () => (this.alerts = []),
    });
  }

  addContact() {
    this.api.post('emergency', { ...this.sosForm, verified: true }).subscribe(() => {
      this.sosForm = {
        type: 'AMBULANCE', name: '', nameLocal: '', phone: '', altPhone: '', address: '',
        area: '', city: '', pincode: '', notes: '', is24x7: true,
      };
      this.loadEmergency();
    });
  }

  verifyContact(c: any) {
    c.verified = true;
    this.api.patch(`emergency/${c.id}`, { verified: true }).subscribe({
      error: () => (c.verified = false),
    });
  }

  removeContact(c: any) {
    if (!confirm(`Remove "${c.name}" from the emergency directory?`)) return;
    this.api.delete(`emergency/${c.id}`).subscribe(() => this.loadEmergency());
  }

  resolveAlert(a: any) {
    this.api.patch(`emergency/sos/${a.id}/resolve`, {}).subscribe(() => this.loadEmergency());
  }

  get pendingStores() { return this.stores.filter((s) => s.status === 'PENDING'); }
  get pendingRiders() { return this.riders.filter((r) => !r.isApproved); }
  get pendingSuppliers() { return this.suppliers.filter((u) => !u.isApproved); }

  get statCards() {
    return [
      { label: 'Stores', value: this.stores.length },
      { label: 'Riders', value: this.riders.length },
      { label: 'Orders', value: this.orderStats.total },
      { label: 'Delivered', value: this.orderStats.byStatus?.DELIVERED || 0 },
    ];
  }

  // Update the row immediately so the button responds instantly, then call the
  // API in the background and revert only if it fails. No full re-fetch.
  approveStore(s: any) {
    const prev = s.status;
    s.status = 'APPROVED';
    this.api.patch(`stores/${s.id}/approve`).subscribe({ error: () => (s.status = prev) });
  }
  rejectStore(s: any) {
    const reason = prompt('Reason for rejection?') || '';
    const prev = s.status;
    s.status = 'REJECTED';
    this.api.patch(`stores/${s.id}/reject`, { reason }).subscribe({ error: () => (s.status = prev) });
  }
  approveRider(r: any) {
    r.isApproved = true;
    this.api.patch(`riders/${r.id}/approve`).subscribe({ error: () => (r.isApproved = false) });
  }
  approveSupplier(u: any) {
    u.isApproved = true;
    this.api.patch(`users/${u.id}/approve`).subscribe({ error: () => (u.isApproved = false) });
  }
  rejectSupplier(u: any) {
    const reason = prompt('Reason for rejection?') || '';
    const prev = u.isApproved;
    u.isApproved = false;
    this.api.patch(`users/${u.id}/reject`, { reason }).subscribe({ error: () => (u.isApproved = prev) });
  }
}
