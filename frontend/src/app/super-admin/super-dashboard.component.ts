import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { I18nService } from '../shared/i18n.service';
import { AuthService, ROLE_META, UserRole } from '../shared/auth.service';

type Tab =
  | 'overview'
  | 'stores'
  | 'riders'
  | 'suppliers'
  | 'users'
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
      <h3 class="mb-0">{{ 'admin.title' | t }}</h3>
      <span class="badge bg-secondary">{{ 'admin.subtitle' | t }}</span>
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
          {{ t.icon ? t.icon + ' ' : '' }}{{ t.labelKey | t }}
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
          <div class="card-header d-flex justify-content-between"><span>{{ 'admin.storesAwaiting' | t }}</span><span class="badge bg-warning text-dark">{{ pendingStores.length }}</span></div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let s of pendingStores">
              <div><div class="fw-semibold">{{ s.name }}</div><small class="text-muted">{{ s.category }} · {{ s.address?.city || '—' }}</small></div>
              <div><button class="btn btn-sm btn-success me-1" (click)="approveStore(s)">{{ 'common.approve' | t }}</button><button class="btn btn-sm btn-outline-danger" (click)="rejectStore(s)">{{ 'common.reject' | t }}</button></div>
            </li>
            <li class="list-group-item text-muted text-center" *ngIf="!pendingStores.length">{{ 'admin.allClear' | t }}</li>
          </ul>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card border-0 h-100">
          <div class="card-header d-flex justify-content-between"><span>{{ 'admin.ridersAwaiting' | t }}</span><span class="badge bg-warning text-dark">{{ pendingRiders.length }}</span></div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let r of pendingRiders">
              <div><div class="fw-semibold">{{ r.user?.name || ('admin.rider' | t) }}</div><small class="text-muted">{{ r.vehicleType }} · {{ r.user?.email }}</small></div>
              <button class="btn btn-sm btn-success" (click)="approveRider(r)">{{ 'common.approve' | t }}</button>
            </li>
            <li class="list-group-item text-muted text-center" *ngIf="!pendingRiders.length">{{ 'admin.allClear' | t }}</li>
          </ul>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card border-0 h-100">
          <div class="card-header d-flex justify-content-between"><span>{{ 'admin.suppliersAwaiting' | t }}</span><span class="badge bg-warning text-dark">{{ pendingSuppliers.length }}</span></div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let u of pendingSuppliers">
              <div><div class="fw-semibold">{{ u.name }}</div><small class="text-muted">{{ u.role }} · {{ u.email }}</small></div>
              <div><button class="btn btn-sm btn-success me-1" (click)="approveSupplier(u)">{{ 'common.approve' | t }}</button><button class="btn btn-sm btn-outline-danger" (click)="rejectSupplier(u)">{{ 'common.reject' | t }}</button></div>
            </li>
            <li class="list-group-item text-muted text-center" *ngIf="!pendingSuppliers.length">{{ 'admin.allClear' | t }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- STORES -->
    <div *ngIf="tab==='stores'" class="card border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>{{ 'admin.store' | t }}</th><th>{{ 'admin.category' | t }}</th><th>{{ 'admin.owner' | t }}</th><th>{{ 'admin.phone' | t }}</th><th>{{ 'admin.city' | t }}</th><th>{{ 'common.status' | t }}</th><th>{{ 'admin.orders' | t }}</th><th class="text-end">{{ 'common.action' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let s of stores">
              <td class="fw-semibold">{{ s.name }}<div class="small text-muted" *ngIf="s.nameLocal">{{ s.nameLocal }}</div></td>
              <td>{{ s.category }}</td>
              <td class="small">{{ s.ownerName || '—' }}</td>
              <td class="small"><a *ngIf="s.phone" [href]="'tel:'+s.phone">{{ s.phone }}</a><span *ngIf="!s.phone">—</span></td>
              <td>{{ s.address?.city || '—' }}</td>
              <td><span class="badge" [ngClass]="s.status==='APPROVED'?'bg-success':(s.status==='REJECTED'?'bg-danger':'bg-warning text-dark')">{{ s.status | status }}</span></td>
              <td>{{ s.totalOrders }}</td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-outline-secondary me-1" (click)="viewAsUser(s.owner)" [attr.title]="'admin.viewAs' | t">👁️</button>
                <button class="btn btn-sm btn-success me-1" *ngIf="s.status!=='APPROVED'" (click)="approveStore(s)">{{ 'common.approve' | t }}</button>
                <button class="btn btn-sm btn-outline-danger me-1" *ngIf="s.status!=='REJECTED'" (click)="rejectStore(s)">{{ 'common.reject' | t }}</button>
                <button class="btn btn-sm btn-danger" (click)="deleteStore(s)" [attr.title]="'admin.delete' | t">🗑</button>
              </td>
            </tr>
            <tr *ngIf="!stores.length"><td colspan="8" class="text-center text-muted py-3">{{ 'admin.noStores' | t }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- RIDERS -->
    <div *ngIf="tab==='riders'" class="card border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>{{ 'admin.rider' | t }}</th><th>{{ 'admin.vehicle' | t }}</th><th>{{ 'admin.phone' | t }}</th><th>{{ 'rider.availability' | t }}</th><th>{{ 'rider.deliveries' | t }}</th><th>{{ 'common.status' | t }}</th><th class="text-end">{{ 'common.action' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of riders">
              <td class="fw-semibold">{{ r.user?.name || ('admin.rider' | t) }}<div class="small text-muted">{{ r.user?.email }}</div></td>
              <td>{{ r.vehicleType }}<div class="small text-muted" *ngIf="r.vehicleNumber">{{ r.vehicleNumber }}</div></td>
              <td class="small"><a *ngIf="r.user?.phone" [href]="'tel:'+r.user?.phone">{{ r.user?.phone }}</a><span *ngIf="!r.user?.phone">—</span></td>
              <td><span class="badge bg-light text-dark">{{ r.availability | status }}</span></td><td>{{ r.totalDeliveries }}</td>
              <td><span class="badge" [ngClass]="r.isApproved?'bg-success':'bg-warning text-dark'">{{ (r.isApproved?'common.approved':'common.pending') | t }}</span></td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-outline-secondary me-1" *ngIf="r.user" (click)="viewAsUser(r.user._id || r.user)" [attr.title]="'admin.viewAs' | t">👁️</button>
                <button class="btn btn-sm btn-success me-1" *ngIf="!r.isApproved" (click)="approveRider(r)">{{ 'common.approve' | t }}</button>
                <button class="btn btn-sm btn-danger" (click)="deleteRider(r)" [attr.title]="'admin.delete' | t">🗑</button>
              </td>
            </tr>
            <tr *ngIf="!riders.length"><td colspan="7" class="text-center text-muted py-3">{{ 'admin.noRiders' | t }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SUPPLIERS (wholesalers & distributors) -->
    <div *ngIf="tab==='suppliers'" class="card border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>{{ 'admin.name' | t }}</th><th>{{ 'admin.role' | t }}</th><th>{{ 'admin.email' | t }}</th><th>{{ 'admin.phone' | t }}</th><th>{{ 'common.status' | t }}</th><th class="text-end">{{ 'common.action' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let u of suppliers">
              <td class="fw-semibold">{{ u.name }}</td>
              <td><span class="badge bg-light text-dark text-capitalize">{{ u.role }}</span></td>
              <td>{{ u.email }}</td><td>{{ u.phone || '—' }}</td>
              <td><span class="badge" [ngClass]="u.isApproved?'bg-success':'bg-warning text-dark'">{{ (u.isApproved?'common.approved':'common.pending') | t }}</span></td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-outline-secondary me-1" (click)="viewAsUser(u.id)" [attr.title]="'admin.viewAs' | t">👁️</button>
                <button class="btn btn-sm btn-success me-1" *ngIf="!u.isApproved" (click)="approveSupplier(u)">{{ 'common.approve' | t }}</button>
                <button class="btn btn-sm btn-outline-danger me-1" *ngIf="u.isApproved" (click)="rejectSupplier(u)">{{ 'admin.revoke' | t }}</button>
                <button class="btn btn-sm btn-danger" (click)="deleteUser(u, 'suppliers')" [attr.title]="'admin.delete' | t">🗑</button>
              </td>
            </tr>
            <tr *ngIf="!suppliers.length"><td colspan="6" class="text-center text-muted py-3">{{ 'admin.noSuppliers' | t }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- USERS (every account of every type, with view-as + delete) -->
    <div *ngIf="tab==='users'" class="card border-0">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span>{{ 'admin.users' | t }} · {{ filteredUsers.length }}</span>
        <div class="rf-chips-scroll">
          <button class="rf-chip" [class.active]="userRole===''" (click)="userRole=''">{{ 'common.all' | t }}</button>
          <button class="rf-chip" *ngFor="let r of userRoleFilters" [class.active]="userRole===r.role" (click)="userRole=r.role">
            {{ r.icon }} {{ i18n.pick(r.en, r.hi) }}
          </button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>{{ 'admin.name' | t }}</th><th>{{ 'admin.role' | t }}</th><th>{{ 'admin.phone' | t }}</th><th>{{ 'common.status' | t }}</th><th>{{ 'admin.joined' | t }}</th><th class="text-end">{{ 'common.action' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let u of filteredUsers">
              <td class="fw-semibold">{{ u.name }}<div class="small text-muted">{{ u.email }}</div></td>
              <td><span class="badge bg-light text-dark">{{ roleLabel(u.role) }}</span></td>
              <td class="small"><a *ngIf="u.phone" [href]="'tel:'+u.phone">{{ u.phone }}</a><span *ngIf="!u.phone">—</span></td>
              <td><span class="rf-pill" [class.ok]="u.isApproved" [class.warn]="!u.isApproved">{{ (u.isApproved?'common.approved':'common.pending') | t }}</span></td>
              <td class="small text-muted">{{ u.createdAt | date:'dd MMM yyyy' }}</td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-outline-secondary me-1" *ngIf="u.role!=='admin' && u.role!=='super_admin'" (click)="viewAsUser(u.id)" [attr.title]="'admin.viewAs' | t">👁️</button>
                <button class="btn btn-sm btn-danger" *ngIf="u.role!=='admin' && u.role!=='super_admin'" (click)="deleteUser(u, 'users')" [attr.title]="'admin.delete' | t">🗑</button>
                <span class="badge bg-dark" *ngIf="u.role==='admin' || u.role==='super_admin'">{{ 'admin.subtitle' | t }}</span>
              </td>
            </tr>
            <tr *ngIf="!filteredUsers.length"><td colspan="6" class="text-center text-muted py-3">{{ 'admin.noUsers' | t }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ORDERS -->
    <div *ngIf="tab==='orders'" class="card border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>{{ 'common.orderNo' | t }}</th><th>{{ 'admin.store' | t }}</th><th>{{ 'admin.rider' | t }}</th><th>{{ 'admin.items' | t }}</th><th>{{ 'admin.amount' | t }}</th><th>{{ 'admin.date' | t }}</th><th>{{ 'common.status' | t }}</th><th class="text-end">{{ 'common.action' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let o of orders">
              <td class="fw-semibold small">{{ o.orderNumber }}</td><td>{{ o.store?.name || '—' }}</td><td>{{ o.rider?.user?.name || '—' }}</td>
              <td class="small">{{ (o.items || []).length }}</td>
              <td>₹{{ (o.totalAmount || 0) + (o.deliveryFee || 0) }}</td>
              <td class="small text-muted">{{ o.createdAt | date:'dd MMM' }}</td>
              <td><span class="badge bg-secondary">{{ o.status | status }}</span></td>
              <td class="text-end"><button class="btn btn-sm btn-danger" (click)="deleteOrder(o)" [attr.title]="'admin.delete' | t">🗑</button></td>
            </tr>
            <tr *ngIf="!orders.length"><td colspan="8" class="text-center text-muted py-3">{{ 'admin.noOrders' | t }}</td></tr>
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
          <div class="card-header">➕ {{ 'admin.addLocalNumber' | t }}</div>
          <div class="card-body">
            <label class="form-label">{{ 'admin.type' | t }}</label>
            <select class="form-select mb-2" [(ngModel)]="sosForm.type" name="etype">
              <option *ngFor="let t of emergencyTypes" [value]="t.key">{{ t.label }}</option>
            </select>
            <input class="form-control mb-2" [placeholder]="'admin.eName' | t"
                   [(ngModel)]="sosForm.name" name="ename">
            <input class="form-control mb-2" placeholder="नाम (हिंदी में)"
                   [(ngModel)]="sosForm.nameLocal" name="enamel">
            <input class="form-control mb-2" [placeholder]="'admin.phone' | t" inputmode="numeric"
                   [(ngModel)]="sosForm.phone" name="ephone">
            <input class="form-control mb-2" [placeholder]="'admin.eAltPhone' | t" inputmode="numeric"
                   [(ngModel)]="sosForm.altPhone" name="ealt">
            <input class="form-control mb-2" [placeholder]="'admin.eAddress' | t"
                   [(ngModel)]="sosForm.address" name="eaddr">
            <div class="row g-2 mb-2">
              <div class="col-4"><input class="form-control" [placeholder]="'admin.area' | t"
                     [(ngModel)]="sosForm.area" name="earea"></div>
              <div class="col-4"><input class="form-control" [placeholder]="'admin.city' | t"
                     [(ngModel)]="sosForm.city" name="ecity"></div>
              <div class="col-4"><input class="form-control" [placeholder]="'common.pincode' | t" inputmode="numeric"
                     [(ngModel)]="sosForm.pincode" name="epin"></div>
            </div>
            <input class="form-control mb-2" [placeholder]="'admin.eNotes' | t"
                   [(ngModel)]="sosForm.notes" name="enotes">
            <div class="form-check form-switch mb-2">
              <input class="form-check-input" type="checkbox" id="e24" [(ngModel)]="sosForm.is24x7"
                     name="e24">
              <label class="form-check-label" for="e24">{{ 'admin.answers24' | t }}</label>
            </div>
            <button class="btn btn-primary w-100" (click)="addContact()"
                    [disabled]="!sosForm.name.trim() || !sosForm.phone.trim()">
              {{ 'admin.addNumber' | t }}
            </button>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <!-- Open help requests raised from the app -->
        <div class="card mb-3" *ngIf="alerts.length">
          <div class="card-header d-flex justify-content-between">
            <span>🆘 {{ 'admin.openHelp' | t }}</span>
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
                <button class="btn btn-sm btn-outline-success" (click)="resolveAlert(a)">{{ 'admin.resolve' | t }}</button>
              </span>
            </li>
          </ul>
        </div>

        <div class="card">
          <div class="card-header d-flex justify-content-between">
            <span>{{ 'admin.localDirectory' | t }}</span>
            <span class="text-muted small">{{ contacts.length }}</span>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr><th>{{ 'admin.type' | t }}</th><th>{{ 'admin.name' | t }}</th><th>{{ 'admin.phone' | t }}</th><th>{{ 'admin.area' | t }}</th><th>{{ 'kyc.verified' | t }}</th>
                  <th class="text-end">{{ 'common.action' | t }}</th></tr>
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
                      {{ (c.verified ? 'kyc.verified' : 'admin.unverified') | t }}
                    </span>
                  </td>
                  <td class="text-end text-nowrap">
                    <button class="btn btn-sm btn-success me-1" *ngIf="!c.verified"
                            (click)="verifyContact(c)">{{ 'admin.verify' | t }}</button>
                    <button class="btn btn-sm btn-outline-danger"
                            (click)="removeContact(c)">{{ 'admin.remove' | t }}</button>
                  </td>
                </tr>
                <tr *ngIf="!contacts.length">
                  <td colspan="6" class="text-center text-muted py-3">
                    {{ 'admin.noLocalNumbers' | t }}
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
        <span>{{ 'admin.vendorsLegacy' | t }}</span>
        <span>
          <a class="btn btn-sm btn-outline-primary me-1" routerLink="/admin/vendors">{{ 'admin.manageVendors' | t }}</a>
          <a class="btn btn-sm btn-outline-secondary" routerLink="/admin/purchase-orders">{{ 'admin.purchaseOrders' | t }}</a>
        </span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>{{ 'admin.name' | t }}</th><th>{{ 'admin.code' | t }}</th><th>{{ 'admin.onTime' | t }}</th><th>{{ 'admin.quality' | t }}</th><th class="text-end">{{ 'common.action' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of vendors">
              <td class="fw-semibold">{{ v.name }}</td><td class="fw-semibold">{{ v.vendorCode }}</td>
              <td>{{ v.onTimeDeliveryRate | number:'1.0-1' }}%</td><td>{{ v.qualityRatingAvg | number:'1.0-2' }}</td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-outline-success me-1" (click)="openVendorLogin(v)">🔑 {{ 'admin.createLogin' | t }}</button>
                <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/admin/vendors', v.id]">{{ 'common.view' | t }}</a>
              </td>
            </tr>
            <tr *ngIf="!vendors.length"><td colspan="5" class="text-center text-muted py-3">{{ 'admin.noVendors' | t }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create vendor login modal -->
    <div class="modal-back" *ngIf="vendorLogin" (click)="vendorLogin=null">
      <div class="card shadow" style="max-width:420px;width:100%" (click)="$event.stopPropagation()">
        <div class="card-header bg-white fw-semibold">🔑 {{ 'admin.createLogin' | t }} — {{ vendorLogin.name }}</div>
        <div class="card-body">
          <p class="small text-muted mb-2">{{ 'admin.createLoginHint' | t }}</p>
          <div class="alert alert-danger py-2" *ngIf="vendorLoginError">{{ vendorLoginError }}</div>
          <div class="alert alert-success py-2" *ngIf="vendorLoginDone">
            ✅ {{ 'admin.loginCreated' | t }}<br>
            <b>{{ vendorLoginForm.email }}</b> · {{ vendorLoginForm.password }}
          </div>
          <ng-container *ngIf="!vendorLoginDone">
            <input class="form-control mb-2" type="email" [placeholder]="'common.email' | t" [(ngModel)]="vendorLoginForm.email" name="vlEmail">
            <input class="form-control mb-2" [placeholder]="'reg.password' | t" [(ngModel)]="vendorLoginForm.password" name="vlPw">
            <button class="btn btn-primary w-100" (click)="createVendorLogin()"
                    [disabled]="!vendorLoginForm.email.trim() || !vendorLoginForm.password.trim() || vendorLoginBusy">
              {{ 'admin.createLogin' | t }}
            </button>
          </ng-container>
        </div>
        <div class="card-footer bg-white text-end">
          <button class="btn btn-light" (click)="vendorLogin=null">{{ 'common.close' | t }}</button>
        </div>
      </div>
    </div>
  `,
})
export class SuperDashboardComponent implements OnInit {
  tab: Tab = 'overview';
  // labelKey is resolved through the t pipe, so tabs switch language too.
  tabs: { key: Tab; labelKey: string; icon?: string }[] = [
    { key: 'overview', labelKey: 'admin.overview' },
    { key: 'stores', labelKey: 'admin.stores' },
    { key: 'riders', labelKey: 'admin.riders' },
    { key: 'suppliers', labelKey: 'admin.suppliers' },
    { key: 'users', labelKey: 'admin.users' },
    { key: 'orders', labelKey: 'admin.orders' },
    { key: 'emergency', labelKey: 'admin.emergency', icon: '🆘' },
    { key: 'vendors', labelKey: 'admin.vendors' },
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

  // Every account, for the Users tab, with a role filter.
  users: any[] = [];
  userRole = '';
  userRoleFilters = (
    ['customer', 'store_owner', 'store_staff', 'rider', 'wholesaler', 'distributor', 'sales', 'service_provider'] as UserRole[]
  ).map((role) => ({ role, icon: ROLE_META[role].icon, en: ROLE_META[role].en, hi: ROLE_META[role].hi }));

  constructor(
    private api: ApiService,
    public i18n: I18nService,
    private auth: AuthService,
  ) {}

  get filteredUsers() {
    return this.userRole ? this.users.filter((u) => u.role === this.userRole) : this.users;
  }

  roleLabel(role: string): string {
    const m = ROLE_META[role as UserRole];
    return m ? this.i18n.pick(m.en, m.hi) : role;
  }

  /** Open one specific account (from any table's 👁️ button or the Users tab). */
  viewAsUser(userId: string) {
    if (!userId) return;
    this.auth.viewAsUser(userId).subscribe({
      error: (e) => alert(e?.error?.message || this.i18n.t('admin.noneOfRole')),
    });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.get('stores').subscribe((s) => (this.stores = s));
    this.api.get('riders').subscribe((r) => (this.riders = r));
    this.api.get('users/suppliers').subscribe((u) => (this.suppliers = u));
    this.api.get('users').subscribe((u: any) => (this.users = (u || []).map((x: any) => ({ ...x, id: x.id ?? x._id }))));
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
    if (!confirm(this.i18n.t('admin.removeContactConfirm'))) return;
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
      { label: this.i18n.t('admin.stores'), value: this.stores.length },
      { label: this.i18n.t('admin.riders'), value: this.riders.length },
      { label: this.i18n.t('admin.orders'), value: this.orderStats.total },
      { label: this.i18n.t('admin.delivered'), value: this.orderStats.byStatus?.DELIVERED || 0 },
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
    const reason = prompt(this.i18n.t('admin.rejectReason')) || '';
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
    const reason = prompt(this.i18n.t('admin.rejectReason')) || '';
    const prev = u.isApproved;
    u.isApproved = false;
    this.api.patch(`users/${u.id}/reject`, { reason }).subscribe({ error: () => (u.isApproved = prev) });
  }

  // --- admin hard-delete for every type ---------------------------------
  // Each removes the row from its list on success; a failure re-fetches so the
  // table never lies about what's actually on the server.
  private del(path: string, list: any[], row: any) {
    if (!confirm(this.i18n.t('admin.deleteConfirm'))) return;
    this.api.delete(path).subscribe({
      next: () => {
        const i = list.indexOf(row);
        if (i >= 0) list.splice(i, 1);
      },
      error: (e) => {
        alert(e?.error?.message || this.i18n.t('admin.deleteFailed'));
        this.load();
      },
    });
  }

  // --- vendor login creation ------------------------------------------------
  vendorLogin: any = null;
  vendorLoginForm = { email: '', password: '' };
  vendorLoginBusy = false;
  vendorLoginError = '';
  vendorLoginDone = false;

  openVendorLogin(v: any) {
    this.vendorLogin = v;
    this.vendorLoginDone = false;
    this.vendorLoginError = '';
    // Suggest a sensible default login so the admin can just hit create.
    const slug = String(v.vendorCode || v.name || 'vendor').toLowerCase().replace(/[^a-z0-9]/g, '');
    this.vendorLoginForm = { email: `${slug}@vendor.ridefleet.test`, password: 'Vendor@1234' };
  }

  createVendorLogin() {
    this.vendorLoginBusy = true;
    this.vendorLoginError = '';
    this.api.post(`vendors/${this.vendorLogin.id}/create-login`, this.vendorLoginForm).subscribe({
      next: () => { this.vendorLoginBusy = false; this.vendorLoginDone = true; },
      error: (e) => { this.vendorLoginBusy = false; this.vendorLoginError = e?.error?.message || this.i18n.t('admin.deleteFailed'); },
    });
  }

  deleteStore(s: any) { this.del(`stores/${s.id}`, this.stores, s); }
  deleteRider(r: any) { this.del(`riders/${r.id}`, this.riders, r); }
  deleteOrder(o: any) { this.del(`orders/${o.id}`, this.orders, o); }
  deleteUser(u: any, listName: 'suppliers' | 'users') { this.del(`users/${u.id}`, this[listName], u); }
}
