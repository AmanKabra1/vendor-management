import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../shared/api.service';
import { AuthService } from '../shared/auth.service';
import { I18nService } from '../shared/i18n.service';
import { MapMarker } from '../shared/map.component';
import { PaymentService } from '../shared/payment.service';
import {
  categoryMeta,
  isOpenNow,
  QUICK_NEEDS,
  REFILLABLE_CATEGORIES,
  refillUnitFor,
} from '../shared/store-categories';

/**
 * The customer screen.
 *
 * Ordered by how a household actually shops in a town:
 *   1. "I need medicine / water / gas right now"  → quick-need tiles
 *   2. "which shop, and is it open"                → nearby list with call buttons
 *   3. "send my list"                              → free text, photo, or items
 *   4. "the usual, again"                          → reorder + repeat orders
 *   5. "what do I owe the kirana"                  → khata balance
 *
 * The list stays free text on purpose: nobody is going to browse a 4,000-SKU
 * catalogue on a 5-inch screen to buy dhaniya, and the shopkeeper reads
 * "2 kilo aata, thoda dhaniya" perfectly well.
 */
@Component({
  selector: 'app-customer-dashboard',
  standalone: false,
  template: `
    <div class="rf-page-head">
      <div class="rf-eyebrow">{{ 'app.tagline' | t }}</div>
      <h3>{{ 'cust.greeting' | t }}</h3>
      <p *ngIf="auth.currentUser">{{ auth.currentUser.name }}</p>
    </div>

    <!-- 1. Quick needs -->
    <div class="rf-tiles mb-4">
      <button class="rf-tile" *ngFor="let q of quickNeeds" [class.active]="category === q.key"
              (click)="pickCategory(q.key)">
        <span class="rf-tile-ic" [style.background]="q.tint + '1f'">{{ q.icon }}</span>
        <span class="rf-tile-label">{{ i18n.pick(q.en, q.hi) }}</span>
      </button>
      <a class="rf-tile" routerLink="/shops">
        <span class="rf-tile-ic" style="background:#6b72801f">🏪</span>
        <span class="rf-tile-label">{{ 'nav.shops' | t }}</span>
      </a>
      <a class="rf-tile" routerLink="/emergency">
        <span class="rf-tile-ic" style="background:#dc26261f">🆘</span>
        <span class="rf-tile-label">{{ 'nav.emergency' | t }}</span>
      </a>
    </div>

    <!-- Khata banner: what you owe, before you order more on credit. -->
    <div class="card mb-3" *ngIf="khata && khata.totalOutstanding > 0">
      <div class="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <div class="rf-eyebrow">{{ 'cust.myKhata' | t }}</div>
          <div class="fs-5">
            {{ 'cust.khataOwed' | t }}
            <span class="rf-amount owed">₹{{ khata.totalOutstanding }}</span>
          </div>
          <div class="small text-muted">
            {{ khata.shops.length }} {{ 'nav.shops' | t }}
          </div>
        </div>
        <button class="btn btn-outline-primary" (click)="showKhata = !showKhata">
          {{ showKhata ? ('common.close' | t) : ('cust.myKhata' | t) }}
        </button>
      </div>
      <ul class="list-group list-group-flush" *ngIf="showKhata">
        <li class="list-group-item d-flex justify-content-between align-items-center"
            *ngFor="let s of khata.shops">
          <span>
            <span class="fw-semibold">{{ s.storeName }}</span>
            <small class="text-muted d-block">{{ s.lastAt | date: 'mediumDate' }}</small>
          </span>
          <span class="d-flex align-items-center gap-2">
            <span class="rf-amount" [class.owed]="s.balance > 0" [class.clear]="s.balance <= 0">
              ₹{{ s.balance }}
            </span>
            <a class="btn btn-sm btn-call" *ngIf="s.storePhone" [href]="'tel:' + s.storePhone">📞</a>
            <a class="btn btn-sm btn-wa" *ngIf="s.storeUpiId"
               [href]="upiLink(s)">UPI</a>
          </span>
        </li>
      </ul>
    </div>

    <div class="row g-4">
      <!-- 2. Where to deliver + which shop -->
      <div class="col-lg-5">
        <div class="card mb-3">
          <div class="card-header">📍 {{ 'cust.myLocation' | t }}</div>
          <div class="card-body">
            <app-location-picker [lat]="lat" [lng]="lng" (locationChange)="onLoc($event)">
            </app-location-picker>

            <!-- The field a rider in a kasba actually navigates by. -->
            <input class="form-control mt-2" [(ngModel)]="landmark" name="custLm"
                   [placeholder]="'common.landmark' | t">
            <div class="form-text">
              {{ i18n.lang() === 'hi'
                  ? 'जैसे: हनुमान मंदिर के पीछे, नीला गेट'
                  : 'e.g. behind Hanuman mandir, blue gate' }}
            </div>

            <button class="btn btn-primary w-100 mt-2" (click)="findStores()">
              🔍 {{ 'cust.findShops' | t }}
            </button>
          </div>
        </div>

        <div class="rf-heavy">
          <app-map [markers]="markers" [center]="[lat, lng]" height="220px"></app-map>
        </div>

        <div class="rf-chips-scroll mt-3" *ngIf="stores.length">
          <button class="rf-chip" [class.active]="!category" (click)="pickCategory('')">
            {{ 'common.all' | t }}
          </button>
          <button class="rf-chip" *ngFor="let c of availableCategories" [class.active]="category === c"
                  (click)="pickCategory(c)">
            {{ meta(c).icon }} {{ i18n.pick(meta(c).en, meta(c).hi) }}
          </button>
        </div>

        <div class="mt-2">
          <div class="rf-shop" *ngFor="let s of stores" [class.selected]="picked?.id === s.id"
               (click)="pick(s)" role="button">
            <span class="rf-shop-ic" [style.background]="meta(s.category).tint + '1f'">
              {{ meta(s.category).icon }}
            </span>
            <div class="rf-shop-main">
              <div class="rf-shop-name">
                {{ i18n.pick(s.name, s.nameLocal) }}
                <span class="rf-pill" [class.ok]="open(s)" [class.danger]="!open(s)">
                  {{ open(s) ? ('common.openNow' | t) : ('common.closedNow' | t) }}
                </span>
              </div>
              <div class="rf-shop-sub">
                {{ i18n.pick(meta(s.category).en, meta(s.category).hi) }}
                <span *ngIf="s.address?.landmark"> · {{ s.address.landmark }}</span>
              </div>
              <div class="rf-shop-sub mt-1">
                <span class="rf-pill ok me-1" *ngIf="s.acceptsUdhaar">📒 {{ 'dir.udhaarOk' | t }}</span>
                <span class="rf-pill muted me-1" *ngIf="s.minOrderValue">
                  {{ 'dir.minOrder' | t }} ₹{{ s.minOrderValue }}
                </span>
              </div>
              <div class="rf-shop-actions">
                <a class="btn btn-sm btn-call" *ngIf="s.phone" [href]="'tel:' + s.phone"
                   (click)="$event.stopPropagation()">📞 {{ 'common.call' | t }}</a>
                <a class="btn btn-sm btn-wa" *ngIf="s.whatsapp" [href]="waLink(s)" target="_blank"
                   rel="noopener" (click)="$event.stopPropagation()">{{ 'common.whatsapp' | t }}</a>
              </div>
            </div>
          </div>

          <div class="rf-empty" *ngIf="searched && !stores.length">
            <span class="rf-empty-ic">🏪</span>
            {{ 'cust.noShops' | t }}
            <div class="mt-2"><a class="btn btn-sm btn-outline-primary" routerLink="/shops">
              {{ 'nav.shops' | t }}
            </a></div>
          </div>
        </div>
      </div>

      <!-- 3. Build the order -->
      <div class="col-lg-7">
        <div class="card mb-3">
          <div class="card-header">
            {{ picked ? i18n.pick(picked.name, picked.nameLocal) : ('cust.pickShop' | t) }}
            <span class="rf-pill warn ms-1" *ngIf="picked && !open(picked)">
              {{ 'common.closedNow' | t }}
            </span>
          </div>
          <div class="card-body" [class.opacity-50]="!picked">
            <!-- The shop's rate board, if they publish one. -->
            <div *ngIf="picked?.priceList?.length" class="mb-3">
              <div class="rf-eyebrow mb-2">{{ 'dir.rateList' | t }}</div>
              <div class="rf-chips-scroll">
                <button class="rf-chip" *ngFor="let it of picked.priceList" [disabled]="!it.available"
                        (click)="addFromRates(it)">
                  {{ i18n.pick(it.name, it.nameLocal) }} · ₹{{ it.price }}/{{ it.unit }}
                </button>
              </div>
            </div>

            <label class="form-label">{{ 'cust.list' | t }}</label>
            <textarea class="form-control mb-1" rows="4" [(ngModel)]="listText" name="listText"
              [placeholder]="listPlaceholder"></textarea>
            <div class="form-text mb-2">{{ 'cust.listHint' | t }}</div>

            <label class="form-label">{{ 'cust.photo' | t }}</label>
            <input type="file" accept="image/*" capture="environment" class="form-control mb-2"
                   (change)="onPhoto($event)">
            <div *ngIf="listImageUrl" class="mb-2 rf-heavy">
              <img [src]="listImageUrl" style="max-height:90px;border-radius:8px">
            </div>

            <div class="d-flex gap-2 mb-2" *ngFor="let it of items; let i = index">
              <input class="form-control" placeholder="Item" [(ngModel)]="it.name" [name]="'in' + i">
              <input type="number" class="form-control" style="max-width:80px" placeholder="Qty"
                     [(ngModel)]="it.quantity" [name]="'iq' + i">
              <input type="number" class="form-control" style="max-width:100px" placeholder="₹"
                     [(ngModel)]="it.price" [name]="'ip' + i">
              <button class="btn btn-outline-danger" (click)="items.splice(i, 1)">✕</button>
            </div>
            <button class="btn btn-sm btn-outline-secondary mb-3"
                    (click)="items.push({ name: '', quantity: 1, price: 0 })">
              + {{ 'common.add' | t }}
            </button>

            <div class="mb-3">
              <app-phone-input name="custPhone" [placeholder]="'common.phone' | t" [value]="phone"
                (valueChange)="phone = $event"></app-phone-input>
            </div>

            <!-- Payment: cash is the default because it is the reality. -->
            <label class="form-label">{{ 'cust.payCod' | t }} / {{ 'cust.payUdhaar' | t }}</label>
            <div class="rf-chips mb-3">
              <button class="rf-chip" [class.active]="paymentMethod === 'COD'"
                      (click)="paymentMethod = 'COD'">💵 {{ 'cust.payCod' | t }}</button>
              <button class="rf-chip" [class.active]="paymentMethod === 'UDHAAR'"
                      *ngIf="picked?.acceptsUdhaar" (click)="paymentMethod = 'UDHAAR'">
                📒 {{ 'cust.payUdhaar' | t }}
              </button>
              <button class="rf-chip" [class.active]="paymentMethod === 'PREPAID'"
                      (click)="paymentMethod = 'PREPAID'">📱 {{ 'cust.payOnline' | t }}</button>
            </div>

            <button class="btn btn-warm btn-lg w-100" [disabled]="!picked || placing" (click)="placeOrder()">
              🛒 {{ placing ? ('cust.placing' | t) : ('cust.place' | t) }}
            </button>
            <div class="alert alert-warning mt-2 mb-0 py-2 small" *ngIf="orderError">{{ orderError }}</div>
          </div>
        </div>

        <!-- 4. Repeat orders: water can, cylinder, milk. -->
        <div class="card mb-3">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>🔄 {{ 'cust.myRefills' | t }}</span>
            <button class="btn btn-sm btn-outline-primary" (click)="refillFormOpen = !refillFormOpen"
                    [disabled]="!picked && !refills.length">
              + {{ 'cust.addRefill' | t }}
            </button>
          </div>

          <div class="card-body border-bottom" *ngIf="refillFormOpen">
            <div class="alert alert-info py-2 small" *ngIf="!picked">
              {{ 'cust.pickShop' | t }}
            </div>
            <div class="row g-2" *ngIf="picked">
              <div class="col-md-5">
                <input class="form-control" [(ngModel)]="refillForm.itemLabel" name="rfItem"
                       placeholder="20L water can / गैस सिलेंडर">
              </div>
              <div class="col-6 col-md-3">
                <select class="form-select" [(ngModel)]="refillForm.category" name="rfCat">
                  <option *ngFor="let c of refillable" [value]="c.key">
                    {{ c.icon }} {{ i18n.pick(c.en, c.hi) }}
                  </option>
                </select>
              </div>
              <div class="col-6 col-md-4">
                <select class="form-select" [(ngModel)]="refillForm.frequency" name="rfFreq">
                  <option value="DAILY">{{ i18n.lang() === 'hi' ? 'रोज़' : 'Every day' }}</option>
                  <option value="ALTERNATE_DAY">{{ i18n.lang() === 'hi' ? 'एक दिन छोड़कर' : 'Alternate day' }}</option>
                  <option value="WEEKLY">{{ i18n.lang() === 'hi' ? 'हफ़्ते में' : 'Weekly' }}</option>
                  <option value="FORTNIGHTLY">{{ i18n.lang() === 'hi' ? '15 दिन में' : 'Every 15 days' }}</option>
                  <option value="MONTHLY">{{ i18n.lang() === 'hi' ? 'महीने में' : 'Monthly' }}</option>
                  <option value="ON_DEMAND">{{ i18n.lang() === 'hi' ? 'ज़रूरत पर' : 'On demand' }}</option>
                </select>
              </div>
              <div class="col-6 col-md-3">
                <input type="number" class="form-control" [(ngModel)]="refillForm.quantity" name="rfQty"
                       placeholder="Qty">
              </div>
              <div class="col-6 col-md-4">
                <input class="form-control" [(ngModel)]="refillForm.preferredTime" name="rfTime"
                       placeholder="Morning / 6-8 pm">
              </div>
              <div class="col-12 col-md-5 d-grid">
                <button class="btn btn-primary" (click)="addRefill()">{{ 'common.save' | t }}</button>
              </div>
            </div>
          </div>

          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2"
                *ngFor="let r of refills">
              <span>
                <span class="fw-semibold">{{ r.itemLabel }}</span>
                <span class="rf-pill muted ms-1">{{ r.quantity }} {{ r.unit }}</span>
                <small class="d-block text-muted">
                  {{ r.store?.name }} · {{ 'cust.nextOn' | t }} {{ r.nextDate | date: 'mediumDate' }}
                </small>
              </span>
              <span class="d-flex gap-1">
                <button class="btn btn-sm btn-outline-secondary" (click)="snooze(r)">
                  {{ 'cust.snooze' | t }}
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="removeRefill(r)">✕</button>
              </span>
            </li>
            <li class="list-group-item text-muted text-center" *ngIf="!refills.length">
              {{ 'common.none' | t }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 5. My orders -->
    <h4 class="mt-4 mb-3">{{ 'nav.orders' | t }}</h4>
    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>#</th><th>{{ 'nav.shops' | t }}</th><th>{{ 'common.total' | t }}</th>
              <th>Status</th><th class="text-end">—</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of orders">
              <td class="small fw-semibold">{{ o.orderNumber }}</td>
              <td>
                {{ o.store?.name }}
                <small class="d-block text-muted">{{ (o.items || []).length }} items</small>
              </td>
              <td class="rf-amount">₹{{ (o.totalAmount || 0) + (o.deliveryFee || 0) }}</td>
              <td>
                <span class="rf-pill" [ngClass]="statusClass(o.status)">{{ o.status }}</span>
                <small class="d-block text-muted" *ngIf="o.paymentMethod === 'UDHAAR'">📒 khata</small>
              </td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-outline-primary me-1" (click)="reorder(o)"
                        [title]="'cust.reorder' | t">🔁</button>
                <button class="btn btn-sm btn-success me-1"
                        *ngIf="o.paymentStatus !== 'COLLECTED' && o.status !== 'CANCELLED' && o.paymentMethod !== 'UDHAAR'"
                        (click)="pay(o)">{{ 'cust.payOnline' | t }}</button>
                <span class="rf-pill ok me-1" *ngIf="o.paymentStatus === 'COLLECTED'">✓</span>
                <a class="btn btn-sm btn-outline-info me-1" [href]="'/track/' + o.id" target="_blank">
                  {{ 'cust.track' | t }}
                </a>
                <button class="btn btn-sm btn-outline-secondary" (click)="openInvoice(o)">
                  {{ 'cust.invoice' | t }}
                </button>
              </td>
            </tr>
            <tr *ngIf="!orders.length">
              <td colspan="5" class="text-center text-muted py-4">{{ 'common.none' | t }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invoice modal -->
    <div class="modal-back" *ngIf="invoice" (click)="invoice = null">
      <div class="card shadow" style="max-width:460px;width:100%" (click)="$event.stopPropagation()"
           id="invoiceBox">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div><h5 class="mb-0">🧾 {{ 'cust.invoice' | t }}</h5>
              <small class="text-muted">{{ invoice.orderNumber }}</small></div>
            <div class="text-end small text-muted">{{ invoice.date | date: 'medium' }}</div>
          </div>
          <hr>
          <div class="small mb-2">
            <b>{{ invoice.store }}</b> → {{ invoice.customer?.name }} ({{ invoice.customer?.address }})
          </div>
          <table class="table table-sm">
            <thead><tr><th>Item</th><th class="text-center">Qty</th><th class="text-end">₹</th></tr></thead>
            <tbody>
              <tr *ngFor="let it of invoice.items">
                <td>{{ it.name }}</td><td class="text-center">{{ it.quantity }}</td>
                <td class="text-end">₹{{ it.price }}</td>
              </tr>
              <tr *ngIf="!invoice.items?.length"><td colspan="3" class="text-muted">See attached list</td></tr>
            </tbody>
          </table>
          <div class="d-flex justify-content-between"><span>Items</span><span>₹{{ invoice.itemsSubtotal }}</span></div>
          <div class="d-flex justify-content-between">
            <span>Delivery <small class="text-muted">({{ invoice.distanceKm }} km)</small></span>
            <span>₹{{ invoice.deliveryFee }}</span>
          </div>
          <hr class="my-2">
          <div class="d-flex justify-content-between fw-bold fs-5">
            <span>{{ 'common.total' | t }}</span><span>₹{{ invoice.total }}</span>
          </div>
          <div class="small text-muted mt-1">{{ invoice.paymentMethod }} · {{ invoice.paymentStatus }}</div>
        </div>
        <div class="card-footer bg-white text-end">
          <button class="btn btn-light me-2" (click)="invoice = null">{{ 'common.close' | t }}</button>
          <button class="btn btn-primary" (click)="print()">Print</button>
        </div>
      </div>
    </div>
  `,
})
export class CustomerDashboardComponent implements OnInit {
  addr = '';
  landmark = '';
  lat = 28.61;
  lng = 77.2;
  searched = false;
  stores: any[] = [];
  picked: any = null;
  markers: MapMarker[] = [];
  category = '';

  listText = '';
  listImageUrl = '';
  items: any[] = [];
  phone = '';
  paymentMethod: 'COD' | 'UDHAAR' | 'PREPAID' = 'COD';
  placing = false;
  orderError = '';

  orders: any[] = [];
  invoice: any = null;

  khata: any = null;
  showKhata = false;

  refills: any[] = [];
  refillFormOpen = false;
  refillForm = {
    itemLabel: '',
    category: 'WATER',
    quantity: 1,
    frequency: 'WEEKLY',
    preferredTime: '',
  };

  quickNeeds = QUICK_NEEDS;
  refillable = REFILLABLE_CATEGORIES;
  meta = categoryMeta;
  open = isOpenNow;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    public i18n: I18nService,
    private payments: PaymentService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.phone = this.auth.currentUser?.phone || '';
    this.loadOrders();
    this.loadKhata();
    this.loadRefills();

    // Arriving from the shop directory with a shop already chosen.
    const storeId = this.route.snapshot.queryParamMap.get('store');
    if (storeId) {
      this.api.get(`public/shops/${storeId}`).subscribe({
        next: (s: any) => {
          this.picked = { ...s, id: s.id ?? s._id };
          this.stores = [this.picked];
        },
        error: () => {},
      });
    }
  }

  get listPlaceholder(): string {
    return this.i18n.lang() === 'hi'
      ? '2 किलो आटा\n1 किलो चीनी\nदूध 2 पैकेट'
      : '2kg Aata\n1kg Sugar\nMilk 2 packets';
  }

  /** Shop types actually present in the current results. */
  get availableCategories(): string[] {
    return [...new Set(this.allStores.map((s) => s.category))];
  }

  private allStores: any[] = [];

  loadOrders() {
    this.api.get('orders').subscribe((o) => (this.orders = o));
  }

  loadKhata() {
    this.api.get('khata/mine').subscribe({
      next: (k: any) => (this.khata = k),
      error: () => (this.khata = null),
    });
  }

  loadRefills() {
    this.api.get('refills/mine').subscribe({
      next: (r: any) => (this.refills = (r || []).map((x: any) => ({ ...x, id: x.id ?? x._id }))),
      error: () => (this.refills = []),
    });
  }

  onLoc(e: { lat: number; lng: number; address?: string }) {
    this.lat = e.lat;
    this.lng = e.lng;
    if (e.address) this.addr = e.address;
  }

  pickCategory(key: string) {
    this.category = this.category === key ? '' : key;
    if (this.searched) this.applyCategory();
    else this.findStores();
  }

  findStores() {
    this.searched = true;
    const q = `stores/nearby?lat=${this.lat}&lng=${this.lng}&radius=20000&open=1`;
    this.api.get(q).subscribe({
      next: (s: any) => {
        this.allStores = (s || []).map((x: any) => ({ ...x, id: x.id ?? x._id }));
        this.applyCategory();
      },
      error: () => {
        this.allStores = [];
        this.stores = [];
      },
    });
  }

  private applyCategory() {
    this.stores = this.category
      ? this.allStores.filter((s) => s.category === this.category)
      : this.allStores;
    this.markers = [
      { lat: this.lat, lng: this.lng, label: 'You', color: '#dc3545' },
      ...this.stores
        .filter((x) => x.location?.coordinates?.length === 2)
        .map((x) => ({
          lat: x.location.coordinates[1],
          lng: x.location.coordinates[0],
          label: x.name,
          color: '#5b21b6',
        })),
    ];
  }

  pick(s: any) {
    this.picked = s;
    if (!s.acceptsUdhaar && this.paymentMethod === 'UDHAAR') this.paymentMethod = 'COD';
  }

  /** Tapping a rate-list item drops it into the itemised lines. */
  addFromRates(it: any) {
    this.items.push({ name: it.name, quantity: 1, price: it.price });
  }

  onPhoto(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => (this.listImageUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  placeOrder() {
    if (!this.picked) return;
    this.orderError = '';

    const cleanItems = this.items.filter((i) => i.name?.trim());
    if (!this.listText.trim() && !this.listImageUrl && !cleanItems.length) {
      this.orderError =
        this.i18n.lang() === 'hi'
          ? 'कृपया सामान की लिस्ट लिखें या फोटो भेजें।'
          : 'Please write your list, add items, or send a photo.';
      return;
    }

    const subtotal = cleanItems.reduce(
      (s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1),
      0,
    );
    const min = Number(this.picked.minOrderValue) || 0;
    if (min && subtotal && subtotal < min) {
      this.orderError =
        this.i18n.lang() === 'hi'
          ? `यह दुकान कम से कम ₹${min} का ऑर्डर लेती है।`
          : `This shop's minimum order is ₹${min}.`;
      return;
    }

    this.placing = true;
    this.api
      .post('orders', {
        store: this.picked.id,
        customer: {
          name: this.auth.currentUser?.name,
          phone: this.phone,
          address: this.addr,
          landmark: this.landmark,
          lat: this.lat,
          lng: this.lng,
        },
        items: cleanItems,
        listText: this.listText,
        listImageUrl: this.listImageUrl,
        paymentMethod: this.paymentMethod,
      })
      .subscribe({
        next: () => {
          this.placing = false;
          this.listText = '';
          this.listImageUrl = '';
          this.items = [];
          this.loadOrders();
          alert(
            this.i18n.lang() === 'hi'
              ? 'ऑर्डर भेज दिया! दुकान पक्का करके राइडर भेजेगी।'
              : 'Order sent! The shop will confirm and send a rider.',
          );
        },
        error: (err) => {
          this.placing = false;
          this.orderError = err?.error?.message || 'Could not place order';
        },
      });
  }

  /** One tap to repeat a past order — the commonest action in daily shopping. */
  reorder(o: any) {
    this.picked = { id: o.store?.id ?? o.store?._id ?? o.store, name: o.store?.name };
    this.listText = o.listText || '';
    this.items = (o.items || []).map((i: any) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
    }));
    this.paymentMethod = o.paymentMethod === 'UDHAAR' ? 'UDHAAR' : 'COD';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  addRefill() {
    if (!this.picked || !this.refillForm.itemLabel.trim()) return;
    this.api
      .post('refills', {
        store: this.picked.id,
        itemLabel: this.refillForm.itemLabel,
        category: this.refillForm.category,
        quantity: Number(this.refillForm.quantity) || 1,
        unit: refillUnitFor(this.refillForm.category),
        frequency: this.refillForm.frequency,
        preferredTime: this.refillForm.preferredTime,
        address: this.addr,
        landmark: this.landmark,
        phone: this.phone,
      })
      .subscribe({
        next: () => {
          this.refillFormOpen = false;
          this.refillForm.itemLabel = '';
          this.loadRefills();
        },
        error: () => {},
      });
  }

  snooze(r: any) {
    this.api.patch(`refills/${r.id}/snooze`, { days: 3 }).subscribe(() => this.loadRefills());
  }

  removeRefill(r: any) {
    this.api.delete(`refills/${r.id}`).subscribe(() => this.loadRefills());
  }

  pay(o: any) {
    this.payments.pay(o.id, () => this.loadOrders());
  }

  openInvoice(o: any) {
    this.api.get(`orders/${o.id}/invoice`).subscribe((inv) => (this.invoice = inv));
  }

  print() {
    window.print();
  }

  statusClass(status: string): string {
    if (status === 'DELIVERED') return 'ok';
    if (status === 'CANCELLED' || status === 'FAILED') return 'danger';
    if (status === 'CREATED') return 'warn';
    return 'info';
  }

  /** A UPI deep link so a khata balance can be cleared from the phone. */
  upiLink(s: any): string {
    const amount = Math.max(Number(s.balance) || 0, 0);
    const params = new URLSearchParams({
      pa: s.storeUpiId,
      pn: s.storeName || 'Shop',
      am: String(amount),
      cu: 'INR',
      tn: 'Khata payment',
    });
    return `upi://pay?${params.toString()}`;
  }

  waLink(s: any): string {
    const digits = String(s.whatsapp || '').replace(/\D/g, '');
    const num = digits.length > 10 ? digits : `91${digits}`;
    const msg =
      this.i18n.lang() === 'hi' ? `नमस्ते ${s.name}, सामान चाहिए —` : `Hello ${s.name}, I'd like to order —`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }
}
