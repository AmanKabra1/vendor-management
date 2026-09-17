import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { AuthService } from '../shared/auth.service';
import { I18nService } from '../shared/i18n.service';
import {
  categoriesByGroup,
  categoryMeta,
  GROUP_LABELS,
  isOpenNow,
  QUICK_NEEDS,
} from '../shared/store-categories';

/**
 * The public shop directory — a phone book for the town, by shop type.
 *
 * This exists because the first thing a person needs is rarely a tracked
 * delivery; it's a number to call. Requiring an account, a GPS pin or an
 * address here would lose the user before they ever place an order, so the
 * whole screen works logged out and searches by pincode or mohalla name.
 */
@Component({
  selector: 'app-shop-directory',
  standalone: false,
  template: `
    <app-public-header [title]="'nav.shops' | t"></app-public-header>
    <div class="container-lg px-0 px-md-2 pb-5">
      <div class="rf-page-head d-flex justify-content-between align-items-start gap-2">
        <div>
          <div class="rf-eyebrow">{{ 'nav.shops' | t }}</div>
          <h3>{{ 'dir.title' | t }}</h3>
          <p>{{ 'dir.subtitle' | t }}</p>
        </div>
        <button class="rf-chip flex-shrink-0" (click)="i18n.toggleLang()">
          🌐 {{ i18n.lang() === 'en' ? 'हिंदी' : 'English' }}
        </button>
      </div>

      <!-- Quick needs: six taps that cover most of what a household buys. -->
      <div class="rf-eyebrow mb-2">{{ 'cust.quickNeeds' | t }}</div>
      <div class="rf-tiles mb-4">
        <button class="rf-tile" *ngFor="let q of quickNeeds" [class.active]="category === q.key"
                (click)="pickCategory(q.key)">
          <span class="rf-tile-ic" [style.background]="tint(q.tint)">{{ q.icon }}</span>
          <span class="rf-tile-label">{{ i18n.pick(q.en, q.hi) }}</span>
          <span class="rf-tile-count" *ngIf="counts[q.key]">{{ counts[q.key] }}</span>
        </button>
      </div>

      <!-- Search: by shop, item, mohalla or pincode — no coordinates. -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="row g-2">
            <div class="col-12 col-md-6">
              <input class="form-control" [(ngModel)]="q" name="dirQ"
                     [placeholder]="'dir.searchPlaceholder' | t" (keyup.enter)="search()">
            </div>
            <div class="col-6 col-md-2">
              <input class="form-control" [(ngModel)]="pincode" name="dirPin" inputmode="numeric"
                     [placeholder]="'common.pincode' | t" (keyup.enter)="search()">
            </div>
            <div class="col-6 col-md-2">
              <input class="form-control" [(ngModel)]="area" name="dirArea"
                     [placeholder]="'common.area' | t" (keyup.enter)="search()">
            </div>
            <div class="col-12 col-md-2 d-grid">
              <button class="btn btn-primary" (click)="search()">🔍 {{ 'common.search' | t }}</button>
            </div>
          </div>

          <div class="rf-chips mt-3">
            <button class="rf-chip" [class.active]="openOnly" (click)="openOnly = !openOnly; load()">
              🕒 {{ 'dir.filterOpen' | t }}
            </button>
            <button class="rf-chip" [class.active]="only24" (click)="only24 = !only24; load()">
              🌙 {{ 'dir.filter24x7' | t }}
            </button>
            <button class="rf-chip" [class.active]="udhaarOnly" (click)="udhaarOnly = !udhaarOnly; load()">
              📒 {{ 'dir.filterUdhaar' | t }}
            </button>
            <button class="rf-chip" (click)="useGps()" [disabled]="locating">
              📍 {{ locating ? ('common.loading' | t) : 'Near me' }}
            </button>
            <button class="rf-chip" *ngIf="category || q || pincode || area || openOnly || only24 || udhaarOnly"
                    (click)="clearFilters()">
              ✕ {{ 'common.cancel' | t }}
            </button>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <!-- Full category list, grouped -->
        <div class="col-lg-4">
          <div class="card">
            <div class="card-header">{{ 'dir.allTypes' | t }}</div>
            <div class="card-body">
              <div *ngFor="let g of groups" class="mb-3">
                <div class="rf-eyebrow mb-2">{{ i18n.pick(groupLabel(g.group).en, groupLabel(g.group).hi) }}</div>
                <div class="rf-chips">
                  <button class="rf-chip" *ngFor="let c of g.items" [class.active]="category === c.key"
                          (click)="pickCategory(c.key)">
                    {{ c.icon }} {{ i18n.pick(c.en, c.hi) }}
                    <span class="text-muted" *ngIf="counts[c.key]">{{ counts[c.key] }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div class="col-lg-8">
          <!-- Scroll anchor: on a phone the category list sits above the
               results, so picking a type jumps here to show what was fetched. -->
          <div #resultsTop style="scroll-margin-top:64px"></div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="rf-eyebrow">
              {{ category ? i18n.pick(meta(category).en, meta(category).hi) : ('common.all' | t) }}
              <span class="text-muted">· {{ shops.length }}</span>
            </div>
            <span class="small text-muted" *ngIf="loading">{{ 'common.loading' | t }}</span>
          </div>

          <div class="rf-empty" *ngIf="!loading && !shops.length">
            <span class="rf-empty-ic">🏪</span>
            {{ 'dir.empty' | t }}
          </div>

          <div class="rf-shop" *ngFor="let s of shops">
            <span class="rf-shop-ic" [style.background]="tint(meta(s.category).tint)">
              {{ meta(s.category).icon }}
            </span>
            <div class="rf-shop-main">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <div class="rf-shop-name">
                  {{ i18n.pick(s.name, s.nameLocal) }}
                  <span class="rf-pill" [class.ok]="open(s)" [class.danger]="!open(s)">
                    {{ open(s) ? ('common.openNow' | t) : ('common.closedNow' | t) }}
                  </span>
                </div>
                <span class="rf-pill info" *ngIf="s.is24x7">24×7</span>
              </div>
              <div class="rf-shop-sub">
                {{ i18n.pick(meta(s.category).en, meta(s.category).hi) }}
                <span *ngIf="s.ownerName">· {{ s.ownerName }}</span>
                · {{ [s.address?.landmark, s.address?.area, s.address?.city, s.address?.pincode] | rfJoin }}
              </div>
              <div class="rf-shop-sub" *ngIf="timings(s) || s.avgDeliveryMins">
                <span *ngIf="timings(s)">⏰ {{ timings(s) }}</span>
                <span *ngIf="s.avgDeliveryMins"> · 🛵 ~{{ s.avgDeliveryMins }} {{ 'shop.min' | t }}</span>
              </div>
              <div class="rf-shop-sub mt-1">
                <span class="rf-pill ok me-1" *ngIf="s.acceptsUdhaar">📒 {{ 'dir.udhaarOk' | t }}</span>
                <span class="rf-pill muted me-1" *ngIf="s.homeDelivery">🛵 {{ 'dir.filterDelivery' | t }}</span>
                <span class="rf-pill muted me-1" *ngIf="s.minOrderValue">
                  {{ 'dir.minOrder' | t }} ₹{{ s.minOrderValue }}
                </span>
                <span class="rf-pill warn me-1" *ngIf="s.rating">★ {{ s.rating }}</span>
              </div>

              <div class="rf-shop-actions">
                <a class="btn btn-sm btn-call" *ngIf="s.phone" [href]="'tel:' + s.phone">
                  📞 {{ 'common.call' | t }}
                </a>
                <a class="btn btn-sm btn-wa" *ngIf="s.whatsapp"
                   [href]="waLink(s)" target="_blank" rel="noopener">
                  {{ 'common.whatsapp' | t }}
                </a>
                <a class="btn btn-sm btn-outline-secondary" *ngIf="hasCoords(s)"
                   [href]="mapLink(s)" target="_blank" rel="noopener">
                  🧭 {{ 'common.directions' | t }}
                </a>
                <button class="btn btn-sm btn-outline-primary" *ngIf="s.priceList?.length"
                        (click)="rates = rates === s.id ? null : s.id">
                  📋 {{ 'dir.rateList' | t }} ({{ s.priceList.length }})
                </button>
                <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/shop', s.id]">
                  ℹ️ {{ 'dir.viewDetails' | t }}
                </a>
                <a class="btn btn-sm btn-warm" *ngIf="auth.isCustomer" routerLink="/customer"
                   [queryParams]="{ store: s.id }">
                  🛒 {{ 'cust.place' | t }}
                </a>
              </div>

              <!-- The shop's own rate board, in place. -->
              <div class="table-responsive mt-2" *ngIf="rates === s.id">
                <table class="table table-sm mb-0">
                  <tbody>
                    <tr *ngFor="let it of s.priceList">
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
      </div>

      <div class="text-center mt-4">
        <a class="btn btn-danger" routerLink="/emergency">🆘 {{ 'nav.emergency' | t }}</a>
      </div>
    </div>
  `,
})
export class ShopDirectoryComponent implements OnInit {
  shops: any[] = [];
  counts: Record<string, number> = {};
  groups = categoriesByGroup().filter((g) => g.items.length);
  quickNeeds = QUICK_NEEDS;

  category = '';
  q = '';
  pincode = '';
  area = '';
  openOnly = false;
  only24 = false;
  udhaarOnly = false;

  loading = false;
  locating = false;
  rates: string | null = null;
  private coords: { lat: number; lng: number } | null = null;

  meta = categoryMeta;
  open = isOpenNow;

  @ViewChild('resultsTop') private resultsTop?: ElementRef<HTMLElement>;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    public i18n: I18nService,
  ) {}

  ngOnInit() {
    this.load();
    this.api.get('public/shops/counts').subscribe({
      next: (c: any) => (this.counts = c || {}),
      error: () => {},
    });
  }

  groupLabel(group: string) {
    return GROUP_LABELS[group as keyof typeof GROUP_LABELS] ?? { en: group, hi: group };
  }

  /** Soft tint of a category's accent colour, for the icon chip. */
  tint(hex: string) {
    return `${hex}1f`;
  }

  pickCategory(key: string) {
    this.category = this.category === key ? '' : key;
    // Picking a category is a clean "show me all X shops" action, so clear the
    // text/pincode/area search and any "Near me" GPS. Otherwise a category
    // would stay narrowed to an earlier pincode that may hold none of it — the
    // mirror image of the stale-filter bug on the search side. The visible
    // toggles (open / 24h / udhaar) are intentional and kept.
    this.q = '';
    this.pincode = '';
    this.area = '';
    this.coords = null;
    this.load();
    this.scrollToResults();
  }

  /**
   * Bring the results into view whenever a category is picked. This matters on
   * a phone (the list stacks above the results) AND on desktop when the type
   * list is long: if you've scrolled down to tap a type near the bottom, the
   * matching shops render at the TOP of the results column — above your view —
   * so it looks like nothing happened. We scroll only when the results anchor
   * isn't already comfortably visible, so it never jumps when you're at the top.
   */
  private scrollToResults() {
    setTimeout(() => {
      const el = this.resultsTop?.nativeElement;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const comfortablyVisible = top >= 0 && top < window.innerHeight * 0.5;
      if (!comfortablyVisible) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  }

  /**
   * Explicit pincode / area / text search — a fresh area lookup.
   *
   * Clears two filters that are easy to forget and have no obvious "on"
   * indicator: a category chip selected earlier (far down the list), and any
   * earlier "Near me" GPS. Left set, either silently narrows the result to
   * empty — which is the "search a pincode, then re-search it and nothing
   * shows until a refresh" bug. The visible toggles (open / 24h / udhaar) are
   * intentional and kept.
   */
  search() {
    this.category = '';
    this.coords = null;
    this.load();
    this.scrollToResults();
  }

  clearFilters() {
    this.category = '';
    this.q = '';
    this.pincode = '';
    this.area = '';
    this.openOnly = false;
    this.only24 = false;
    this.udhaarOnly = false;
    this.coords = null;
    this.load();
  }

  private queryString() {
    const params: Record<string, any> = {};
    if (this.category) params['category'] = this.category;
    if (this.q) params['q'] = this.q;
    if (this.pincode) params['pincode'] = this.pincode;
    if (this.area) params['area'] = this.area;
    if (this.openOnly) params['open'] = 1;
    if (this.only24) params['is24x7'] = 1;
    if (this.udhaarOnly) params['udhaar'] = 1;
    if (this.coords) {
      params['lat'] = this.coords.lat;
      params['lng'] = this.coords.lng;
      params['radius'] = 15000;
    }
    const qs = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
    return qs ? `?${qs}` : '';
  }

  load() {
    this.loading = true;
    const path = this.coords ? 'public/shops/nearby' : 'public/shops';
    this.api.get(`${path}${this.queryString()}`).subscribe({
      next: (rows: any) => {
        this.loading = false;
        this.shops = (rows || []).map((s: any) => ({ ...s, id: s.id ?? s._id }));
      },
      error: () => {
        this.loading = false;
        this.shops = [];
      },
    });
  }

  useGps() {
    if (!navigator.geolocation) return;
    this.locating = true;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        this.locating = false;
        this.coords = { lat: p.coords.latitude, lng: p.coords.longitude };
        this.load();
      },
      () => (this.locating = false),
      { timeout: 8000 },
    );
  }

  hasCoords(s: any): boolean {
    const c = s?.location?.coordinates;
    return Array.isArray(c) && c.length === 2 && (c[0] !== 0 || c[1] !== 0);
  }

  /** Short timings string for the card ("8:00 – 21:00" or "24×7"). */
  timings(s: any): string {
    if (s?.is24x7) return this.i18n.pick('24×7', '24×7');
    const h = s?.operatingHours;
    return h?.open && h?.close ? `${h.open} – ${h.close}` : '';
  }

  /** Opens the phone's own maps app, which everyone already has. */
  mapLink(s: any): string {
    const [lng, lat] = s.location.coordinates;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  /** Pre-fills a WhatsApp order message so the shop gets a usable ping. */
  waLink(s: any): string {
    const digits = String(s.whatsapp || '').replace(/\D/g, '');
    const num = digits.length > 10 ? digits : `91${digits}`;
    const msg =
      this.i18n.lang() === 'hi'
        ? `नमस्ते ${s.name}, मुझे कुछ सामान चाहिए —`
        : `Hello ${s.name}, I'd like to order —`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }
}
