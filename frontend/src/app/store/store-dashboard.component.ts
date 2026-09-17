import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { AuthService } from '../shared/auth.service';
import { I18nService } from '../shared/i18n.service';
import { MapMarker } from '../shared/map.component';
import { TrackingService } from '../shared/tracking.service';
import {
  categoriesByGroup,
  categoryMeta,
  GROUP_LABELS,
  SHOP_UNITS,
} from '../shared/store-categories';

type Tab = 'orders' | 'khata' | 'refills' | 'rates' | 'staff' | 'profile';

/**
 * The shopkeeper's screen, tabbed by the jobs a shop actually does in a day:
 * take orders, write the udhaar khata, run the refill round, keep the rate
 * board current, manage whoever else works the counter, and open or shut.
 *
 * The khata tab is first among the "back office" tabs on purpose — for most
 * kirana shops the credit book is the business record, and digitising it is the
 * single change that makes an app worth opening every day.
 */
@Component({
  selector: 'app-store-dashboard',
  standalone: false,
  template: `
    <div class="rf-page-head d-flex justify-content-between align-items-start flex-wrap gap-2">
      <div>
        <div class="rf-eyebrow">{{ meta(store?.category).icon }}
          {{ store ? i18n.pick(meta(store.category).en, meta(store.category).hi) : '' }}</div>
        <h3>{{ store ? i18n.pick(store.name, store.nameLocal) : ('store.title' | t) }}</h3>
        <p *ngIf="store">
          <span class="rf-pill" [ngClass]="store.status === 'APPROVED' ? 'ok' : 'warn'">
            {{ store.status }}
          </span>
          <span class="rf-pill muted ms-1">{{ store.totalOrders || 0 }} {{ 'nav.orders' | t }}</span>
        </p>
      </div>

      <!-- Shutter switch: the most-used control in the whole app for a shop. -->
      <div class="card" *ngIf="store" style="min-width:240px">
        <div class="card-body py-2">
          <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" id="shutter"
                   [checked]="!store.closedToday" (change)="toggleShutter()">
            <label class="form-check-label fw-semibold" for="shutter">
              {{ store.closedToday ? ('store.shutterClosed' | t) : ('store.shutterOpen' | t) }}
            </label>
          </div>
          <div class="form-text">{{ 'store.shutterHint' | t }}</div>
        </div>
      </div>
    </div>

    <app-kyc *ngIf="canManageShop"></app-kyc>

    <!-- ============ No shop yet: register one ============ -->
    <div *ngIf="!store" class="card mb-4">
      <div class="card-header">{{ 'store.create' | t }}</div>
      <div class="card-body">
        <div class="alert alert-info py-2 small" *ngIf="auth.isStoreStaff">
          {{ 'store.staffHint' | t }}
        </div>

        <ng-container *ngIf="canManageShop">
          <div class="row g-2 mb-3">
            <div class="col-md-6">
              <label class="form-label">{{ 'common.name' | t }}</label>
              <input class="form-control" [placeholder]="'store.namePlaceholder' | t"
                     [(ngModel)]="storeForm.name" name="sname">
            </div>
            <div class="col-md-6">
              <label class="form-label">{{ i18n.lang() === 'hi' ? 'दुकान का नाम (हिंदी में)' : 'Shop name in Hindi' }}</label>
              <input class="form-control" placeholder="शर्मा किराना स्टोर"
                     [(ngModel)]="storeForm.nameLocal" name="snameLocal">
            </div>
          </div>

          <!-- Category picker with icons: faster and language-proof. -->
          <label class="form-label">{{ 'dir.allTypes' | t }}</label>
          <div *ngFor="let g of groups" class="mb-2">
            <div class="rf-eyebrow mb-1">
              {{ i18n.pick(groupLabel(g.group).en, groupLabel(g.group).hi) }}
            </div>
            <div class="rf-chips">
              <button class="rf-chip" *ngFor="let c of g.items"
                      [class.active]="storeForm.category === c.key"
                      (click)="storeForm.category = c.key">
                {{ c.icon }} {{ i18n.pick(c.en, c.hi) }}
              </button>
            </div>
          </div>

          <div class="row g-2 mt-2">
            <div class="col-md-4">
              <label class="form-label">{{ 'common.phone' | t }}</label>
              <input class="form-control" [(ngModel)]="storeForm.phone" name="sphone" inputmode="numeric">
            </div>
            <div class="col-md-4">
              <label class="form-label">{{ 'common.whatsapp' | t }}</label>
              <input class="form-control" [(ngModel)]="storeForm.whatsapp" name="swa" inputmode="numeric">
            </div>
            <div class="col-md-4">
              <label class="form-label">UPI ID</label>
              <input class="form-control" [(ngModel)]="storeForm.upiId" name="supi"
                     [placeholder]="'store.upiPlaceholder' | t">
            </div>

            <div class="col-md-4">
              <label class="form-label">{{ 'shop.ownerName' | t }}</label>
              <input class="form-control" [(ngModel)]="storeForm.ownerName" name="sown">
            </div>
            <div class="col-md-4">
              <label class="form-label">{{ 'shop.altPhone' | t }}</label>
              <input class="form-control" [(ngModel)]="storeForm.altPhone" name="salt" inputmode="numeric">
            </div>
            <div class="col-md-4">
              <label class="form-label">{{ 'shop.gst' | t }}</label>
              <input class="form-control" [(ngModel)]="storeForm.gstNumber" name="sgst">
            </div>
            <div class="col-md-3">
              <label class="form-label">{{ 'shop.establishedYear' | t }}</label>
              <input type="number" class="form-control" [(ngModel)]="storeForm.establishedYear" name="syear" placeholder="1998">
            </div>
            <div class="col-md-3">
              <label class="form-label">{{ 'shop.weeklyOff' | t }}</label>
              <input class="form-control" [(ngModel)]="storeForm.weeklyOff" name="swoff" placeholder="Sunday">
            </div>
            <div class="col-md-3">
              <label class="form-label">{{ 'shop.deliveryTime' | t }} ({{ 'shop.min' | t }})</label>
              <input type="number" class="form-control" [(ngModel)]="storeForm.avgDeliveryMins" name="sdel" placeholder="30">
            </div>
            <div class="col-md-3">
              <label class="form-label">{{ 'shop.payment' | t }}</label>
              <div class="d-flex flex-wrap gap-2 pt-1">
                <label class="rf-chip" *ngFor="let m of payModeKeys" style="cursor:pointer"
                       [class.active]="payModes[m]">
                  <input type="checkbox" class="d-none" [(ngModel)]="payModes[m]" [name]="'pm'+m"> {{ m }}
                </label>
              </div>
            </div>
            <div class="col-12">
              <label class="form-label">{{ 'shop.about' | t }}</label>
              <textarea class="form-control" rows="2" [(ngModel)]="storeForm.description" name="sabout"></textarea>
            </div>

            <div class="col-md-4">
              <label class="form-label">{{ 'common.landmark' | t }}</label>
              <input class="form-control" [(ngModel)]="storeForm.landmark" name="slm">
            </div>
            <div class="col-md-4">
              <label class="form-label">{{ 'common.area' | t }}</label>
              <input class="form-control" [(ngModel)]="storeForm.area" name="sarea">
            </div>
            <div class="col-md-2">
              <label class="form-label">{{ 'common.city' | t }}</label>
              <input class="form-control" [(ngModel)]="storeForm.city" name="scity">
            </div>
            <div class="col-md-2">
              <label class="form-label">{{ 'common.pincode' | t }}</label>
              <input class="form-control" [(ngModel)]="storeForm.pincode" name="spin" inputmode="numeric">
            </div>
          </div>

          <div class="row g-2 mt-2">
            <div class="col-6 col-md-3">
              <label class="form-label">{{ 'common.open' | t }}</label>
              <input type="time" class="form-control" [(ngModel)]="storeForm.open" name="sopen">
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label">{{ 'common.closed' | t }}</label>
              <input type="time" class="form-control" [(ngModel)]="storeForm.close" name="sclose">
            </div>
            <div class="col-12 col-md-6 d-flex align-items-end gap-3 flex-wrap">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="s24"
                       [(ngModel)]="storeForm.is24x7" name="s24">
                <label class="form-check-label" for="s24">24×7</label>
              </div>
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="sud"
                       [(ngModel)]="storeForm.acceptsUdhaar" name="sud">
                <label class="form-check-label" for="sud">📒 {{ 'dir.udhaarOk' | t }}</label>
              </div>
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="sem"
                       [(ngModel)]="storeForm.emergencyService" name="sem">
                <label class="form-check-label" for="sem">🆘 {{ 'nav.emergency' | t }}</label>
              </div>
            </div>
          </div>

          <label class="form-label mt-3">📍 {{ 'cust.myLocation' | t }}</label>
          <app-location-picker [lat]="storeForm.lat" [lng]="storeForm.lng"
                               (locationChange)="onStoreLoc($event)"></app-location-picker>

          <button class="btn btn-primary btn-lg mt-3" (click)="createStore()"
                  [disabled]="!storeForm.name.trim() || saving">
            {{ 'store.create' | t }}
          </button>
          <small class="d-block text-muted mt-1">{{ 'store.awaitingApproval' | t }}</small>
        </ng-container>
      </div>
    </div>

    <!-- ============ Has a shop: tabbed workspace ============ -->
    <ng-container *ngIf="store">
      <div class="rf-tabs">
        <button class="rf-tab" [class.active]="tab === 'orders'" (click)="go('orders')">
          🧾 {{ 'store.tabOrders' | t }}
          <span class="rf-tab-badge" *ngIf="newOrderCount">{{ newOrderCount }}</span>
        </button>
        <button class="rf-tab" [class.active]="tab === 'khata'" (click)="go('khata')">
          📒 {{ 'store.tabKhata' | t }}
        </button>
        <button class="rf-tab" [class.active]="tab === 'refills'" (click)="go('refills')">
          🔄 {{ 'store.tabRefills' | t }}
          <span class="rf-tab-badge" *ngIf="dueRefills.length">{{ dueRefills.length }}</span>
        </button>
        <button class="rf-tab" [class.active]="tab === 'rates'" (click)="go('rates')">
          📋 {{ 'store.tabRates' | t }}
        </button>
        <button class="rf-tab" *ngIf="canManageShop" [class.active]="tab === 'staff'"
                (click)="go('staff')">🧑‍💼 {{ 'store.tabStaff' | t }}</button>
        <button class="rf-tab" *ngIf="canManageShop" [class.active]="tab === 'profile'"
                (click)="go('profile')">⚙️ {{ 'store.tabProfile' | t }}</button>
      </div>

      <!-- ---------- ORDERS ---------- -->
      <div *ngIf="tab === 'orders'" class="row g-4">
        <div class="col-lg-4">
          <div class="card">
            <div class="card-header">📞 {{ i18n.lang() === 'hi' ? 'फ़ोन पर आया ऑर्डर' : 'Order taken on the phone' }}</div>
            <div class="card-body">
              <!-- Most small-town orders still arrive by phone call. Letting the
                   counter type one in is what makes tracking and khata work at all. -->
              <input class="form-control mb-2" [placeholder]="'common.name' | t"
                     [(ngModel)]="orderForm.cname">
              <div class="mb-2">
                <app-phone-input name="cphone" [placeholder]="'common.phone' | t"
                                 [value]="orderForm.cphone"
                                 (valueChange)="orderForm.cphone = $event"></app-phone-input>
              </div>
              <input class="form-control mb-2" [placeholder]="'common.landmark' | t"
                     [(ngModel)]="orderForm.landmark">
              <input class="form-control mb-2"
                     [placeholder]="i18n.lang() === 'hi' ? 'पता' : 'Drop address'"
                     [(ngModel)]="orderForm.caddr">
              <input class="form-control mb-2"
                     [placeholder]="i18n.lang() === 'hi' ? 'सामान' : 'Items'"
                     [(ngModel)]="orderForm.item">
              <input class="form-control mb-2" [placeholder]="'common.amount' | t" type="number"
                     [(ngModel)]="orderForm.amount">
              <div class="rf-chips mb-2">
                <button class="rf-chip" [class.active]="orderForm.paymentMethod === 'COD'"
                        (click)="orderForm.paymentMethod = 'COD'">💵 {{ 'cust.payCod' | t }}</button>
                <button class="rf-chip" [class.active]="orderForm.paymentMethod === 'UDHAAR'"
                        (click)="orderForm.paymentMethod = 'UDHAAR'">📒 {{ 'store.addCredit' | t }}</button>
              </div>
              <button class="btn btn-primary w-100" (click)="createOrder()"
                      [disabled]="store.status !== 'APPROVED'">
                {{ 'common.add' | t }}
              </button>
              <small *ngIf="store.status !== 'APPROVED'" class="text-danger d-block mt-1">
                {{ 'store.awaitingApproval' | t }}
              </small>
            </div>
          </div>
        </div>

        <div class="col-lg-8">
          <div class="card">
            <div class="card-header">{{ 'store.tabOrders' | t }}</div>
            <div class="table-responsive">
              <table class="table align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>#</th><th>{{ 'common.name' | t }}</th><th>Status</th>
                    <th>{{ 'nav.riderHub' | t }}</th><th>—</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let o of orders">
                    <td class="small fw-semibold">
                      {{ o.orderNumber }}
                      <span class="rf-pill warn d-block mt-1" *ngIf="o.paymentMethod === 'UDHAAR'">📒</span>
                    </td>
                    <td>
                      {{ o.customer?.name }}
                      <small class="d-block text-muted" *ngIf="o.customer?.landmark">
                        📍 {{ o.customer.landmark }}
                      </small>
                      <a class="small" *ngIf="o.customer?.phone" [href]="'tel:' + o.customer.phone">
                        📞 {{ o.customer.phone }}
                      </a>
                    </td>
                    <td><span class="rf-pill" [ngClass]="statusClass(o.status)">{{ o.status }}</span></td>
                    <td>{{ o.rider?.user?.name || '—' }}</td>
                    <td class="text-nowrap">
                      <button class="btn btn-sm btn-outline-primary me-1" *ngIf="o.status === 'CREATED'"
                              (click)="openAssign(o)">{{ 'store.findRider' | t }}</button>
                      <button class="btn btn-sm btn-outline-info me-1"
                              *ngIf="o.rider && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'"
                              (click)="track(o)">{{ 'cust.track' | t }}</button>
                      <span *ngIf="o.otp && o.status !== 'DELIVERED'" class="rf-pill info">
                        OTP {{ o.otp }}
                      </span>
                      <button class="btn btn-sm btn-outline-secondary ms-1"
                              *ngIf="o.status === 'DELIVERED' && o.paymentMethod === 'UDHAAR'"
                              (click)="khataFromOrder(o)">📒 {{ 'store.addCredit' | t }}</button>
                    </td>
                  </tr>
                  <tr *ngIf="!orders.length">
                    <td colspan="5" class="text-center text-muted py-4">{{ 'common.none' | t }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ---------- KHATA (udhaar book) ---------- -->
      <div *ngIf="tab === 'khata'" class="row g-4">
        <div class="col-lg-4">
          <div class="card stat-card mb-3">
            <div class="card-body">
              <div class="rf-eyebrow">{{ 'store.khataOutstanding' | t }}</div>
              <div class="display-6">₹{{ khataSummary?.outstanding || 0 }}</div>
              <div class="small text-muted">
                {{ khataSummary?.withBalance || 0 }} / {{ khataSummary?.customers || 0 }}
                {{ 'store.khataCustomers' | t }}
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">✍️ {{ 'store.tabKhata' | t }}</div>
            <div class="card-body">
              <input class="form-control mb-2" [placeholder]="'common.name' | t"
                     [(ngModel)]="khataForm.customerName" name="kname">
              <input class="form-control mb-2" [placeholder]="'common.phone' | t" inputmode="numeric"
                     [(ngModel)]="khataForm.customerPhone" name="kphone">
              <input type="number" class="form-control mb-2" [placeholder]="'common.amount' | t"
                     [(ngModel)]="khataForm.amount" name="kamt">
              <input class="form-control mb-2" [placeholder]="'common.note' | t"
                     [(ngModel)]="khataForm.note" name="knote">
              <div class="d-grid gap-2">
                <button class="btn btn-danger" (click)="addKhata('CREDIT')" [disabled]="!khataValid">
                  ➕ {{ 'store.addCredit' | t }}
                </button>
                <button class="btn btn-success" (click)="addKhata('PAYMENT')" [disabled]="!khataValid">
                  ✅ {{ 'store.addPayment' | t }}
                </button>
              </div>
              <div class="form-text mt-2">
                {{ i18n.lang() === 'hi'
                    ? 'ग्राहक को भी यही हिसाब उसके फ़ोन पर दिखेगा।'
                    : 'The customer sees the same balance on their own phone.' }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-8">
          <div class="card">
            <div class="card-header d-flex justify-content-between">
              <span>{{ 'store.khataCustomers' | t }}</span>
              <span class="text-muted small">{{ khataCustomers.length }}</span>
            </div>
            <div>
              <div class="rf-khata-row" *ngFor="let c of khataCustomers">
                <span>
                  <span class="fw-semibold">{{ c.customerName }}</span>
                  <small class="d-block text-muted">
                    {{ c.customerPhone }} · {{ c.lastAt | date: 'mediumDate' }}
                  </small>
                </span>
                <span class="d-flex align-items-center gap-2">
                  <span class="rf-amount" [class.owed]="c.balance > 0" [class.clear]="c.balance <= 0">
                    ₹{{ c.balance }}
                  </span>
                  <a class="btn btn-sm btn-call" [href]="'tel:' + c.customerPhone">📞</a>
                  <a class="btn btn-sm btn-wa" [href]="khataReminder(c)" target="_blank" rel="noopener">
                    {{ 'common.whatsapp' | t }}
                  </a>
                  <button class="btn btn-sm btn-outline-secondary" (click)="openLedger(c)">📄</button>
                </span>
              </div>
              <div class="rf-empty" *ngIf="!khataCustomers.length">
                <span class="rf-empty-ic">📒</span>{{ 'common.none' | t }}
              </div>
            </div>
          </div>

          <div class="card mt-3" *ngIf="ledger">
            <div class="card-header d-flex justify-content-between">
              <span>{{ ledger.customerName }} · <b>₹{{ ledger.balance }}</b></span>
              <button class="btn btn-sm btn-light" (click)="ledger = null">✕</button>
            </div>
            <div class="table-responsive">
              <table class="table table-sm mb-0">
                <tbody>
                  <tr *ngFor="let e of ledger.entries">
                    <td>{{ e.at | date: 'dd MMM' }}</td>
                    <td>{{ e.note || '—' }}</td>
                    <td class="text-end">
                      <span [class.text-danger]="e.type === 'CREDIT'"
                            [class.text-success]="e.type === 'PAYMENT'">
                        {{ e.type === 'CREDIT' ? '+' : '−' }}₹{{ e.amount }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ---------- REFILLS (the delivery round) ---------- -->
      <div *ngIf="tab === 'refills'">
        <div class="card mb-3">
          <div class="card-header">
            📅 {{ 'store.dueToday' | t }} <span class="rf-pill danger ms-1">{{ dueRefills.length }}</span>
          </div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2"
                *ngFor="let r of dueRefills">
              <span>
                <span class="fw-semibold">{{ r.itemLabel }}</span>
                <span class="rf-pill muted ms-1">{{ r.quantity }} {{ r.unit }}</span>
                <small class="d-block text-muted">
                  {{ r.customerName || r.customerUser?.name }} · 📍 {{ r.landmark || r.address }}
                  <span *ngIf="r.preferredTime"> · 🕒 {{ r.preferredTime }}</span>
                </small>
              </span>
              <span class="d-flex gap-1">
                <a class="btn btn-sm btn-call" *ngIf="r.phone" [href]="'tel:' + r.phone">📞</a>
                <button class="btn btn-sm btn-success" (click)="markDelivered(r)">
                  ✓ {{ 'store.markDelivered' | t }}
                </button>
              </span>
            </li>
            <li class="list-group-item text-muted text-center" *ngIf="!dueRefills.length">
              {{ 'common.none' | t }}
            </li>
          </ul>
        </div>

        <div class="card">
          <div class="card-header">🔄 {{ 'store.tabRefills' | t }}</div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center"
                *ngFor="let r of upcomingRefills">
              <span>
                <span class="fw-semibold">{{ r.itemLabel }}</span>
                <small class="d-block text-muted">
                  {{ r.customerName || r.customerUser?.name }} ·
                  {{ 'cust.nextOn' | t }} {{ r.nextDate | date: 'mediumDate' }}
                </small>
              </span>
              <span class="rf-pill muted">{{ r.frequency }}</span>
            </li>
            <li class="list-group-item text-muted text-center" *ngIf="!upcomingRefills.length">
              {{ 'common.none' | t }}
            </li>
          </ul>
        </div>
      </div>

      <!-- ---------- RATE LIST ---------- -->
      <div *ngIf="tab === 'rates'">
        <div class="card">
          <div class="card-header">📋 {{ 'store.tabRates' | t }}</div>
          <div class="card-body">
            <p class="small text-muted">
              {{ i18n.lang() === 'hi'
                  ? 'अपने मुख्य सामान का रेट लिखें — ग्राहक इसे देखकर सीधे ऑर्डर कर सकता है। पूरा स्टॉक भरने की ज़रूरत नहीं।'
                  : 'List your main items and rates — customers can order straight off it. No need to enter full stock.' }}
            </p>

            <div class="row g-2 mb-2 align-items-center" *ngFor="let it of priceList; let i = index">
              <div class="col-12 col-md-4">
                <input class="form-control" [placeholder]="'common.item' | t" [(ngModel)]="it.name" [name]="'pn' + i">
              </div>
              <div class="col-6 col-md-3">
                <input class="form-control" placeholder="हिंदी नाम" [(ngModel)]="it.nameLocal"
                       [name]="'pl' + i">
              </div>
              <div class="col-6 col-md-2">
                <input type="number" class="form-control" placeholder="₹" [(ngModel)]="it.price"
                       [name]="'pp' + i">
              </div>
              <div class="col-8 col-md-2">
                <select class="form-select" [(ngModel)]="it.unit" [name]="'pu' + i">
                  <option *ngFor="let u of units" [value]="u">{{ u }}</option>
                </select>
              </div>
              <div class="col-4 col-md-1 d-flex gap-1">
                <button class="btn btn-sm" [class.btn-success]="it.available"
                        [class.btn-outline-secondary]="!it.available"
                        (click)="it.available = !it.available"
                        [title]="it.available ? 'Available' : 'Out of stock'">
                  {{ it.available ? '✓' : '✕' }}
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="priceList.splice(i, 1)">🗑</button>
              </div>
            </div>

            <button class="btn btn-outline-secondary me-2"
                    (click)="priceList.push({ name: '', nameLocal: '', price: 0, unit: 'kg', available: true })">
              + {{ 'store.addRate' | t }}
            </button>
            <button class="btn btn-primary" (click)="savePriceList()" [disabled]="saving">
              {{ 'store.publishRates' | t }}
            </button>
          </div>
        </div>
      </div>

      <!-- ---------- STAFF ---------- -->
      <div *ngIf="tab === 'staff'">
        <div class="card">
          <div class="card-header">🧑‍💼 {{ 'store.tabStaff' | t }}</div>
          <div class="card-body">
            <p class="small text-muted">{{ 'store.staffHint' | t }}</p>
            <div class="row g-2">
              <div class="col-md-8">
                <input class="form-control" [(ngModel)]="staffIdentifier" name="staffId"
                       [placeholder]="'store.addStaff' | t">
              </div>
              <div class="col-md-4 d-grid">
                <button class="btn btn-primary" (click)="addStaff()" [disabled]="!staffIdentifier.trim()">
                  + {{ 'common.add' | t }}
                </button>
              </div>
            </div>
            <div class="alert alert-warning mt-2 mb-0 py-2 small" *ngIf="staffError">{{ staffError }}</div>
          </div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center"
                *ngFor="let s of staff">
              <span>
                <span class="fw-semibold">{{ s.name }}</span>
                <small class="d-block text-muted">{{ s.email }} · {{ s.phone }}</small>
              </span>
              <button class="btn btn-sm btn-outline-danger" (click)="removeStaff(s)">
                {{ 'common.delete' | t }}
              </button>
            </li>
            <li class="list-group-item text-muted text-center" *ngIf="!staff.length">
              {{ 'common.none' | t }}
            </li>
          </ul>
        </div>
      </div>

      <!-- ---------- PROFILE / SETTINGS ---------- -->
      <div *ngIf="tab === 'profile'">
        <div class="card">
          <div class="card-header">⚙️ {{ 'store.tabProfile' | t }}</div>
          <div class="card-body">
            <div class="row g-2">
              <div class="col-md-6">
                <label class="form-label">{{ 'common.name' | t }}</label>
                <input class="form-control" [(ngModel)]="store.name" name="pname">
              </div>
              <div class="col-md-6">
                <label class="form-label">हिंदी नाम</label>
                <input class="form-control" [(ngModel)]="store.nameLocal" name="pnamel">
              </div>
              <div class="col-md-4">
                <label class="form-label">{{ 'common.phone' | t }}</label>
                <input class="form-control" [(ngModel)]="store.phone" name="pphone" inputmode="numeric">
              </div>
              <div class="col-md-4">
                <label class="form-label">{{ 'common.whatsapp' | t }}</label>
                <input class="form-control" [(ngModel)]="store.whatsapp" name="pwa" inputmode="numeric">
              </div>
              <div class="col-md-4">
                <label class="form-label">UPI ID</label>
                <input class="form-control" [(ngModel)]="store.upiId" name="pupi">
              </div>
              <div class="col-md-4">
                <label class="form-label">{{ 'shop.ownerName' | t }}</label>
                <input class="form-control" [(ngModel)]="store.ownerName" name="pown">
              </div>
              <div class="col-md-4">
                <label class="form-label">{{ 'shop.altPhone' | t }}</label>
                <input class="form-control" [(ngModel)]="store.altPhone" name="palt" inputmode="numeric">
              </div>
              <div class="col-md-4">
                <label class="form-label">{{ 'shop.gst' | t }}</label>
                <input class="form-control" [(ngModel)]="store.gstNumber" name="pgst">
              </div>
              <div class="col-md-3">
                <label class="form-label">{{ 'shop.establishedYear' | t }}</label>
                <input type="number" class="form-control" [(ngModel)]="store.establishedYear" name="pyear">
              </div>
              <div class="col-md-3">
                <label class="form-label">{{ 'shop.weeklyOff' | t }}</label>
                <input class="form-control" [(ngModel)]="store.weeklyOff" name="pwoff">
              </div>
              <div class="col-md-3">
                <label class="form-label">{{ 'shop.deliveryTime' | t }} ({{ 'shop.min' | t }})</label>
                <input type="number" class="form-control" [(ngModel)]="store.avgDeliveryMins" name="pdel">
              </div>
              <div class="col-md-3">
                <label class="form-label">{{ 'shop.payment' | t }}</label>
                <div class="d-flex flex-wrap gap-1 pt-1">
                  <label class="rf-chip" *ngFor="let m of payModeKeys" style="cursor:pointer;font-size:.78rem"
                         [class.active]="storePayModes[m]">
                    <input type="checkbox" class="d-none" [(ngModel)]="storePayModes[m]" [name]="'ppm'+m"> {{ m }}
                  </label>
                </div>
              </div>
              <div class="col-12">
                <label class="form-label">{{ 'shop.about' | t }}</label>
                <textarea class="form-control" rows="2" [(ngModel)]="store.description" name="pabout"></textarea>
              </div>
              <div class="col-md-4">
                <label class="form-label">{{ 'common.landmark' | t }}</label>
                <input class="form-control" [(ngModel)]="store.address.landmark" name="plm">
              </div>
              <div class="col-md-4">
                <label class="form-label">{{ 'common.area' | t }}</label>
                <input class="form-control" [(ngModel)]="store.address.area" name="parea">
              </div>
              <div class="col-md-2">
                <label class="form-label">{{ 'common.city' | t }}</label>
                <input class="form-control" [(ngModel)]="store.address.city" name="pcity">
              </div>
              <div class="col-md-2">
                <label class="form-label">{{ 'common.pincode' | t }}</label>
                <input class="form-control" [(ngModel)]="store.address.pincode" name="ppin"
                       inputmode="numeric">
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">{{ 'common.open' | t }}</label>
                <input type="time" class="form-control" [(ngModel)]="store.operatingHours.open"
                       name="popen">
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">{{ 'common.closed' | t }}</label>
                <input type="time" class="form-control" [(ngModel)]="store.operatingHours.close"
                       name="pclose">
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">{{ 'dir.minOrder' | t }} (₹)</label>
                <input type="number" class="form-control" [(ngModel)]="store.minOrderValue" name="pmin">
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label">{{ i18n.lang() === 'hi' ? 'डिलीवरी दूरी' : 'Delivery radius' }} (km)</label>
                <input type="number" class="form-control" [(ngModel)]="store.deliveryRadiusKm"
                       name="prad">
              </div>
              <div class="col-12 d-flex gap-3 flex-wrap mt-2">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="p24" [(ngModel)]="store.is24x7"
                         name="p24">
                  <label class="form-check-label" for="p24">24×7</label>
                </div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="pud"
                         [(ngModel)]="store.acceptsUdhaar" name="pud">
                  <label class="form-check-label" for="pud">📒 {{ 'dir.udhaarOk' | t }}</label>
                </div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="phd"
                         [(ngModel)]="store.homeDelivery" name="phd">
                  <label class="form-check-label" for="phd">🛵 {{ 'dir.filterDelivery' | t }}</label>
                </div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="pem"
                         [(ngModel)]="store.emergencyService" name="pem">
                  <label class="form-check-label" for="pem">🆘 {{ 'nav.emergency' | t }}</label>
                </div>
              </div>
            </div>
            <button class="btn btn-primary mt-3" (click)="saveProfile()" [disabled]="saving">
              {{ 'common.save' | t }}
            </button>
            <span class="text-success small ms-2" *ngIf="savedMsg">✓ {{ savedMsg }}</span>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- Assign rider modal -->
    <div class="modal-back" *ngIf="assigning" (click)="assigning = null">
      <div class="card shadow" style="max-width:560px;width:100%" (click)="$event.stopPropagation()">
        <div class="card-header">{{ 'store.findRider' | t }}</div>
        <div class="rf-heavy">
          <app-map [markers]="riderMarkers" [center]="storeCenter" height="220px"></app-map>
        </div>
        <ul class="list-group list-group-flush">
          <li class="list-group-item d-flex justify-content-between align-items-center"
              *ngFor="let r of nearbyRiders">
            <span>{{ r.user?.name || 'Rider' }} <small class="text-muted">· {{ r.vehicleType }}</small></span>
            <button class="btn btn-sm btn-success" (click)="assign(r)">{{ 'common.add' | t }}</button>
          </li>
          <li class="list-group-item text-muted text-center" *ngIf="!nearbyRiders.length">
            {{ 'common.none' | t }}
          </li>
        </ul>
        <div class="card-footer bg-white text-end">
          <button class="btn btn-light" (click)="assigning = null">{{ 'common.close' | t }}</button>
        </div>
      </div>
    </div>

    <!-- Live tracking modal -->
    <div class="modal-back" *ngIf="tracking" (click)="closeTrack()">
      <div class="card shadow" style="max-width:560px;width:100%" (click)="$event.stopPropagation()">
        <div class="card-header d-flex justify-content-between">
          <span>{{ tracking.orderNumber }}</span>
          <span class="rf-pill info">{{ trackStatus }}</span>
        </div>
        <div class="rf-heavy">
          <app-map [markers]="trackMarkers" [center]="storeCenter" height="260px"></app-map>
        </div>
        <div class="card-footer bg-white d-flex justify-content-between">
          <button class="btn btn-outline-secondary btn-sm" (click)="copyTrackLink()">🔗</button>
          <button class="btn btn-light" (click)="closeTrack()">{{ 'common.close' | t }}</button>
        </div>
      </div>
    </div>
  `,
})
export class StoreDashboardComponent implements OnInit {
  tab: Tab = 'orders';

  stores: any[] = [];
  store: any = null;
  orders: any[] = [];
  saving = false;
  savedMsg = '';

  storeForm = {
    name: '',
    nameLocal: '',
    category: 'KIRANA',
    ownerName: '',
    phone: '',
    altPhone: '',
    whatsapp: '',
    upiId: '',
    gstNumber: '',
    establishedYear: null as number | null,
    weeklyOff: '',
    avgDeliveryMins: null as number | null,
    description: '',
    landmark: '',
    area: '',
    city: '',
    pincode: '',
    open: '08:00',
    close: '21:00',
    is24x7: false,
    acceptsUdhaar: true,
    emergencyService: false,
    lat: 28.61,
    lng: 77.2,
  };

  /** Payment modes the shop accepts (checkbox group in the create + profile forms). */
  payModeKeys = ['Cash', 'UPI', 'Card', 'Paytm'];
  payModes: Record<string, boolean> = { Cash: true, UPI: true, Card: false, Paytm: false };
  storePayModes: Record<string, boolean> = { Cash: true, UPI: true, Card: false, Paytm: false };

  /** Reads a {mode: bool} map into the string array the API stores. */
  private pickModes(map: Record<string, boolean>): string[] {
    return this.payModeKeys.filter((k) => map[k]);
  }

  orderForm = {
    cname: '',
    cphone: '',
    caddr: '',
    landmark: '',
    item: '',
    amount: 0,
    paymentMethod: 'COD' as 'COD' | 'UDHAAR',
  };

  // khata
  khataSummary: any = null;
  khataCustomers: any[] = [];
  ledger: any = null;
  khataForm = { customerName: '', customerPhone: '', amount: 0, note: '' };

  // refills
  dueRefills: any[] = [];
  upcomingRefills: any[] = [];

  // rates
  priceList: any[] = [];
  units = SHOP_UNITS;

  // staff
  staff: any[] = [];
  staffIdentifier = '';
  staffError = '';

  // rider assignment / tracking
  assigning: any = null;
  nearbyRiders: any[] = [];
  storeCenter: [number, number] = [28.61, 77.2];
  riderMarkers: MapMarker[] = [];
  tracking: any = null;
  trackStatus = '';
  trackMarkers: MapMarker[] = [];

  groups = categoriesByGroup().filter((g) => g.items.length);
  meta = categoryMeta;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    public i18n: I18nService,
    private track$: TrackingService,
  ) {}

  ngOnInit() {
    this.load();
  }

  /**
   * Who may change the shop itself. Owners and service providers own their
   * listing; counter staff can work orders and khata but must not be able to
   * rewrite the rate list, timings or payout details.
   */
  get canManageShop(): boolean {
    return this.auth.isStoreOwner || this.auth.isServiceProvider;
  }

  get newOrderCount(): number {
    return this.orders.filter((o) => o.status === 'CREATED').length;
  }

  get khataValid(): boolean {
    return (
      !!this.khataForm.customerName.trim() &&
      String(this.khataForm.customerPhone).replace(/\D/g, '').length >= 10 &&
      Number(this.khataForm.amount) > 0
    );
  }

  groupLabel(group: string) {
    return GROUP_LABELS[group as keyof typeof GROUP_LABELS] ?? { en: group, hi: group };
  }

  load() {
    this.api.get('stores').subscribe((s) => {
      this.stores = (s || []).map((x: any) => ({ ...x, id: x.id ?? x._id }));
      this.store = this.stores[0] || null;
      if (this.store) {
        // Defaults so the settings form never binds to undefined.
        this.store.address = this.store.address || {};
        this.store.operatingHours = this.store.operatingHours || { open: '08:00', close: '21:00' };
        // Reflect the saved payment modes in the checkbox group.
        const saved: string[] = this.store.paymentModes || [];
        for (const k of this.payModeKeys) this.storePayModes[k] = saved.includes(k);
        this.priceList = (this.store.priceList || []).map((p: any) => ({ ...p }));
        this.loadKhata();
        this.loadRefills();
        if (this.canManageShop) this.loadStaff();
      }
    });
    this.api.get('orders').subscribe((o) => (this.orders = o || []));
  }

  go(tab: Tab) {
    this.tab = tab;
  }

  // ------------------------------------------------------------ shop setup

  onStoreLoc(e: { lat: number; lng: number }) {
    this.storeForm.lat = e.lat;
    this.storeForm.lng = e.lng;
  }

  createStore() {
    this.saving = true;
    const f = this.storeForm;
    this.api
      .post('stores', {
        name: f.name,
        nameLocal: f.nameLocal,
        category: f.category,
        ownerName: f.ownerName,
        phone: f.phone,
        altPhone: f.altPhone,
        whatsapp: f.whatsapp,
        upiId: f.upiId,
        gstNumber: f.gstNumber,
        establishedYear: f.establishedYear || undefined,
        weeklyOff: f.weeklyOff,
        avgDeliveryMins: f.avgDeliveryMins || undefined,
        paymentModes: this.pickModes(this.payModes),
        description: f.description,
        address: {
          landmark: f.landmark,
          area: f.area,
          city: f.city,
          pincode: f.pincode,
        },
        operatingHours: { open: f.open, close: f.close, days: [] },
        is24x7: f.is24x7,
        acceptsUdhaar: f.acceptsUdhaar,
        emergencyService: f.emergencyService,
        lat: f.lat,
        lng: f.lng,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.load();
        },
        error: () => (this.saving = false),
      });
  }

  toggleShutter() {
    const closed = !this.store.closedToday;
    this.api.patch(`stores/${this.store.id}/shutter`, { closed }).subscribe({
      next: (s: any) => (this.store.closedToday = s.closedToday),
      error: () => {},
    });
  }

  saveProfile() {
    this.saving = true;
    this.savedMsg = '';
    const s = this.store;
    this.api
      .patch(`stores/${s.id}`, {
        name: s.name,
        nameLocal: s.nameLocal,
        ownerName: s.ownerName,
        phone: s.phone,
        altPhone: s.altPhone,
        whatsapp: s.whatsapp,
        upiId: s.upiId,
        gstNumber: s.gstNumber,
        establishedYear: Number(s.establishedYear) || 0,
        weeklyOff: s.weeklyOff,
        avgDeliveryMins: Number(s.avgDeliveryMins) || 0,
        paymentModes: this.pickModes(this.storePayModes),
        description: s.description,
        address: s.address,
        operatingHours: s.operatingHours,
        is24x7: !!s.is24x7,
        acceptsUdhaar: !!s.acceptsUdhaar,
        homeDelivery: !!s.homeDelivery,
        emergencyService: !!s.emergencyService,
        minOrderValue: Number(s.minOrderValue) || 0,
        deliveryRadiusKm: Number(s.deliveryRadiusKm) || 5,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.savedMsg = this.i18n.t('common.save');
        },
        error: () => (this.saving = false),
      });
  }

  savePriceList() {
    this.saving = true;
    this.api.put(`stores/${this.store.id}/price-list`, { items: this.priceList }).subscribe({
      next: (s: any) => {
        this.saving = false;
        this.priceList = (s.priceList || []).map((p: any) => ({ ...p }));
      },
      error: () => (this.saving = false),
    });
  }

  // ---------------------------------------------------------------- orders

  createOrder() {
    const f = this.orderForm;
    this.api
      .post('orders', {
        store: this.store.id,
        customer: {
          name: f.cname,
          phone: f.cphone,
          address: f.caddr,
          landmark: f.landmark,
        },
        items: [{ name: f.item, quantity: 1, price: f.amount }],
        totalAmount: f.amount,
        paymentMethod: f.paymentMethod,
      })
      .subscribe(() => {
        // An udhaar order is also a khata line — write it once, here.
        if (f.paymentMethod === 'UDHAAR' && f.cname && f.cphone && f.amount) {
          this.api
            .post('khata', {
              store: this.store.id,
              customerName: f.cname,
              customerPhone: f.cphone,
              type: 'CREDIT',
              amount: Number(f.amount),
              note: f.item,
            })
            .subscribe({ next: () => this.loadKhata(), error: () => {} });
        }
        this.orderForm = {
          cname: '', cphone: '', caddr: '', landmark: '', item: '', amount: 0,
          paymentMethod: 'COD',
        };
        this.load();
      });
  }

  openAssign(o: any) {
    this.assigning = o;
    const lat = this.store.location?.coordinates?.[1] ?? 28.61;
    const lng = this.store.location?.coordinates?.[0] ?? 77.2;
    this.storeCenter = [lat, lng];
    this.api
      .get(`riders/nearby?lat=${lat}&lng=${lng}&radius=20000&status=AVAILABLE`)
      .subscribe((r) => {
        this.nearbyRiders = r || [];
        this.riderMarkers = [
          { lat, lng, label: this.store.name, color: '#5b21b6' },
          ...this.nearbyRiders
            .filter((x: any) => x.currentLocation?.coordinates?.length === 2)
            .map((x: any) => ({
              lat: x.currentLocation.coordinates[1],
              lng: x.currentLocation.coordinates[0],
              label: x.user?.name || 'Rider',
              color: '#15803d',
            })),
        ];
      });
  }

  assign(r: any) {
    this.api.patch(`orders/${this.assigning.id}/assign-rider`, { riderId: r.id }).subscribe(() => {
      this.assigning = null;
      this.load();
    });
  }

  track(o: any) {
    this.tracking = o;
    this.trackStatus = o.status;
    const lat = this.store.location?.coordinates?.[1] ?? 28.61;
    const lng = this.store.location?.coordinates?.[0] ?? 77.2;
    this.storeCenter = [lat, lng];
    this.trackMarkers = [{ lat, lng, label: this.store.name, color: '#5b21b6' }];
    this.track$.joinOrder(o.id);
    this.track$.onLocation((loc) => {
      if (loc.orderId !== this.tracking?.id) return;
      this.trackMarkers = [
        this.trackMarkers[0],
        { lat: loc.lat, lng: loc.lng, label: 'Rider', color: '#15803d' },
      ];
    });
    this.track$.onStatus((s) => {
      if (s.orderId === this.tracking?.id) this.trackStatus = s.status;
    });
  }

  closeTrack() {
    this.tracking = null;
  }

  copyTrackLink() {
    const url = `${location.origin}/track/${this.tracking.id}`;
    navigator.clipboard?.writeText(url);
    alert(url);
  }

  statusClass(status: string): string {
    if (status === 'DELIVERED') return 'ok';
    if (status === 'CANCELLED' || status === 'FAILED') return 'danger';
    if (status === 'CREATED') return 'warn';
    return 'info';
  }

  // ----------------------------------------------------------------- khata

  loadKhata() {
    this.api.get(`khata/store/${this.store.id}/summary`).subscribe({
      next: (s: any) => (this.khataSummary = s),
      error: () => {},
    });
    this.api.get(`khata/store/${this.store.id}/customers`).subscribe({
      next: (c: any) => (this.khataCustomers = c || []),
      error: () => (this.khataCustomers = []),
    });
  }

  addKhata(type: 'CREDIT' | 'PAYMENT') {
    if (!this.khataValid) return;
    this.api
      .post('khata', {
        store: this.store.id,
        customerName: this.khataForm.customerName,
        customerPhone: this.khataForm.customerPhone,
        type,
        amount: Number(this.khataForm.amount),
        note: this.khataForm.note,
      })
      .subscribe(() => {
        this.khataForm = { customerName: '', customerPhone: '', amount: 0, note: '' };
        this.loadKhata();
      });
  }

  /** Pre-fills the khata form from a delivered udhaar order. */
  khataFromOrder(o: any) {
    this.tab = 'khata';
    this.khataForm = {
      customerName: o.customer?.name || '',
      customerPhone: o.customer?.phone || '',
      amount: (o.totalAmount || 0) + (o.deliveryFee || 0),
      note: o.orderNumber,
    };
  }

  openLedger(c: any) {
    this.api
      .get(`khata/store/${this.store.id}/customer/${c.customerPhone}`)
      .subscribe({ next: (l: any) => (this.ledger = l), error: () => {} });
  }

  /** A polite WhatsApp reminder — far more effective than a paper chit. */
  khataReminder(c: any): string {
    const msg =
      this.i18n.lang() === 'hi'
        ? `नमस्ते ${c.customerName}, ${this.store.name} से — आपका खाता ₹${c.balance} बाकी है। धन्यवाद।`
        : `Hello ${c.customerName}, this is ${this.store.name}. Your khata balance is ₹${c.balance}. Thank you.`;
    const digits = String(c.customerPhone).replace(/\D/g, '');
    return `https://wa.me/91${digits.slice(-10)}?text=${encodeURIComponent(msg)}`;
  }

  // --------------------------------------------------------------- refills

  loadRefills() {
    this.api.get(`refills/store/${this.store.id}`).subscribe({
      next: (r: any) => {
        this.dueRefills = (r?.due || []).map((x: any) => ({ ...x, id: x.id ?? x._id }));
        this.upcomingRefills = (r?.upcoming || []).map((x: any) => ({ ...x, id: x.id ?? x._id }));
      },
      error: () => {
        this.dueRefills = [];
        this.upcomingRefills = [];
      },
    });
  }

  markDelivered(r: any) {
    this.api.patch(`refills/${r.id}/delivered`, {}).subscribe(() => this.loadRefills());
  }

  // ----------------------------------------------------------------- staff

  loadStaff() {
    this.api.get(`stores/${this.store.id}/staff`).subscribe({
      next: (s: any) => (this.staff = (s || []).map((x: any) => ({ ...x, id: x.id ?? x._id }))),
      error: () => (this.staff = []),
    });
  }

  addStaff() {
    this.staffError = '';
    this.api
      .post(`stores/${this.store.id}/staff`, { identifier: this.staffIdentifier })
      .subscribe({
        next: () => {
          this.staffIdentifier = '';
          this.loadStaff();
        },
        error: (err) => (this.staffError = err?.error?.message || 'Could not add staff'),
      });
  }

  removeStaff(s: any) {
    this.api.delete(`stores/${this.store.id}/staff/${s.id}`).subscribe(() => this.loadStaff());
  }
}
