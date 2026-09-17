import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../shared/api.service';
import { AuthService } from '../shared/auth.service';
import { I18nService } from '../shared/i18n.service';
import { categoryMeta, isOpenNow } from '../shared/store-categories';

/**
 * A full public page for one shop — everything a customer wants before they
 * call or order: who runs it, timings, how it takes payment, how far it
 * delivers, the whole rate board, and a map. No login required, because the
 * first thing anyone wants is still a phone number.
 */
@Component({
  selector: 'app-shop-detail',
  standalone: false,
  template: `
    <app-public-header [title]="shop ? i18n.pick(shop.name, shop.nameLocal) : ('nav.shops' | t)">
    </app-public-header>

    <div class="container-lg px-2 pb-5" style="max-width:760px">
      <div class="rf-empty" *ngIf="notFound">
        <span class="rf-empty-ic">🏪</span>{{ 'shop.notListed' | t }}
      </div>

      <div *ngIf="shop">
        <!-- Header card -->
        <div class="card mb-3">
          <img *ngIf="shop.photoUrl" [src]="shop.photoUrl" class="rf-heavy"
               style="width:100%;max-height:220px;object-fit:cover" alt="">
          <div class="card-body">
            <div class="d-flex gap-3 align-items-start">
              <span class="rf-shop-ic" style="width:54px;height:54px;font-size:26px"
                    [style.background]="tint(meta(shop.category).tint)">{{ meta(shop.category).icon }}</span>
              <div class="flex-grow-1">
                <h4 class="mb-1">{{ i18n.pick(shop.name, shop.nameLocal) }}</h4>
                <div class="text-muted">
                  {{ i18n.pick(meta(shop.category).en, meta(shop.category).hi) }}
                  <span *ngIf="shop.ownerName">· {{ 'shop.owner' | t }}: {{ shop.ownerName }}</span>
                </div>
                <div class="mt-2 d-flex gap-2 flex-wrap">
                  <span class="rf-pill" [class.ok]="open(shop)" [class.danger]="!open(shop)">
                    {{ open(shop) ? ('common.openNow' | t) : ('common.closedNow' | t) }}
                  </span>
                  <span class="rf-pill info" *ngIf="shop.is24x7">24×7</span>
                  <span class="rf-pill ok" *ngIf="shop.acceptsUdhaar">📒 {{ 'dir.udhaarOk' | t }}</span>
                  <span class="rf-pill muted" *ngIf="shop.homeDelivery">🛵 {{ 'dir.filterDelivery' | t }}</span>
                  <span class="rf-pill warn" *ngIf="shop.rating">★ {{ shop.rating }} ({{ shop.ratingCount || 0 }})</span>
                </div>
              </div>
            </div>

            <p class="mt-3 mb-0" *ngIf="shop.description">{{ shop.description }}</p>

            <!-- Big contact buttons -->
            <div class="d-flex gap-2 flex-wrap mt-3">
              <a class="btn btn-call" *ngIf="shop.phone" [href]="'tel:' + shop.phone">📞 {{ 'common.call' | t }}</a>
              <a class="btn btn-wa" *ngIf="shop.whatsapp" [href]="waLink()" target="_blank" rel="noopener">{{ 'common.whatsapp' | t }}</a>
              <a class="btn btn-outline-secondary" *ngIf="hasCoords()" [href]="mapLink()" target="_blank" rel="noopener">🧭 {{ 'common.directions' | t }}</a>
              <a class="btn btn-warm" *ngIf="auth.isCustomer" routerLink="/customer" [queryParams]="{ store: shop.id }">🛒 {{ 'shop.orderNow' | t }}</a>
            </div>
          </div>
        </div>

        <!-- Details grid -->
        <div class="card mb-3">
          <div class="card-header">{{ 'shop.contact' | t }}</div>
          <div class="card-body">
            <div class="row g-2">
              <div class="col-sm-6" *ngIf="timingText()">
                <div class="rf-eyebrow">{{ 'shop.timings' | t }}</div>
                <div>⏰ {{ timingText() }}</div>
              </div>
              <div class="col-sm-6" *ngIf="shop.weeklyOff">
                <div class="rf-eyebrow">{{ 'shop.weeklyOff' | t }}</div>
                <div>{{ shop.weeklyOff }}</div>
              </div>
              <div class="col-sm-6" *ngIf="shop.avgDeliveryMins">
                <div class="rf-eyebrow">{{ 'shop.deliveryTime' | t }}</div>
                <div>🛵 ~{{ shop.avgDeliveryMins }} {{ 'shop.min' | t }}</div>
              </div>
              <div class="col-sm-6" *ngIf="shop.deliveryRadiusKm">
                <div class="rf-eyebrow">{{ 'shop.deliveryRadius' | t }}</div>
                <div>{{ shop.deliveryRadiusKm }} {{ 'common.km' | t }}</div>
              </div>
              <div class="col-sm-6" *ngIf="shop.minOrderValue">
                <div class="rf-eyebrow">{{ 'shop.minOrder' | t }}</div>
                <div>₹{{ shop.minOrderValue }}</div>
              </div>
              <div class="col-sm-6" *ngIf="shop.paymentModes?.length || shop.upiId">
                <div class="rf-eyebrow">{{ 'shop.payment' | t }}</div>
                <div>💳 {{ paymentText() }}</div>
              </div>
              <div class="col-sm-6" *ngIf="shop.establishedYear">
                <div class="rf-eyebrow">{{ 'shop.established' | t }}</div>
                <div>{{ shop.establishedYear }}</div>
              </div>
              <div class="col-sm-6" *ngIf="shop.altPhone">
                <div class="rf-eyebrow">{{ 'shop.altPhone' | t }}</div>
                <a [href]="'tel:' + shop.altPhone">{{ shop.altPhone }}</a>
              </div>
              <div class="col-12" *ngIf="addressText()">
                <div class="rf-eyebrow">{{ 'common.landmark' | t }}</div>
                <div>📍 {{ addressText() }}</div>
              </div>
              <div class="col-12" *ngIf="shop.serviceAreas?.length">
                <div class="rf-eyebrow">{{ 'shop.serviceAreas' | t }}</div>
                <div>{{ shop.serviceAreas.join(', ') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Map -->
        <app-map *ngIf="hasCoords()" [markers]="markers" [center]="center" height="240px"></app-map>

        <!-- Full rate list -->
        <div class="card mt-3" *ngIf="shop.priceList?.length">
          <div class="card-header d-flex justify-content-between">
            <span>{{ 'shop.rateBoard' | t }}</span>
            <span class="text-muted small">{{ shop.priceList.length }}</span>
          </div>
          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0">
              <tbody>
                <tr *ngFor="let it of shop.priceList">
                  <td>{{ i18n.pick(it.name, it.nameLocal) }}</td>
                  <td class="text-muted small">{{ it.unit }}</td>
                  <td class="text-end fw-semibold">₹{{ it.price }}</td>
                  <td class="text-end">
                    <span class="rf-pill" [class.ok]="it.available" [class.muted]="!it.available">
                      {{ it.available ? ('common.open' | t) : '—' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ShopDetailComponent implements OnInit {
  shop: any = null;
  notFound = false;
  markers: any[] = [];
  center: [number, number] = [22.72, 75.86];

  meta = categoryMeta;
  open = isOpenNow;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public auth: AuthService,
    public i18n: I18nService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get(`public/shops/${id}`).subscribe({
      next: (s: any) => {
        this.shop = { ...s, id: s.id ?? s._id };
        if (this.hasCoords()) {
          const [lng, lat] = this.shop.location.coordinates;
          this.center = [lat, lng];
          this.markers = [{ lat, lng, label: this.shop.name, color: '#7c3aed' }];
        }
      },
      error: () => (this.notFound = true),
    });
  }

  tint(hex: string) {
    return `${hex}1f`;
  }

  hasCoords(): boolean {
    const c = this.shop?.location?.coordinates;
    return Array.isArray(c) && c.length === 2 && (c[0] !== 0 || c[1] !== 0);
  }

  timingText(): string {
    if (this.shop?.is24x7) return this.i18n.t('dir.filter24x7');
    const h = this.shop?.operatingHours;
    return h?.open && h?.close ? `${h.open} – ${h.close}` : '';
  }

  paymentText(): string {
    const modes = [...(this.shop?.paymentModes || [])];
    if (this.shop?.upiId && !modes.some((m) => /upi/i.test(m))) modes.push('UPI');
    if (!modes.length) modes.push(this.i18n.t('shop.cash'));
    return modes.join(', ');
  }

  addressText(): string {
    const a = this.shop?.address || {};
    return [a.landmark, a.area, a.city, a.pincode].filter((p: string) => (p || '').trim()).join(', ');
  }

  mapLink(): string {
    const [lng, lat] = this.shop.location.coordinates;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  waLink(): string {
    const digits = String(this.shop.whatsapp || '').replace(/\D/g, '');
    const num = digits.length > 10 ? digits : `91${digits}`;
    const msg =
      this.i18n.lang() === 'hi'
        ? `नमस्ते ${this.shop.name}, मुझे कुछ सामान चाहिए —`
        : `Hello ${this.shop.name}, I'd like to order —`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }
}
