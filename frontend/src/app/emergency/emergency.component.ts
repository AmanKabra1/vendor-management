import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { AuthService } from '../shared/auth.service';
import { I18nService } from '../shared/i18n.service';
import { categoryMeta } from '../shared/store-categories';

interface Helpline {
  type: string;
  name: string;
  nameLocal: string;
  phone: string;
  notes: string;
}

interface LocalContact extends Helpline {
  id: string;
  altPhone?: string;
  address?: string;
  area?: string;
  city?: string;
  pincode?: string;
  is24x7?: boolean;
  verified?: boolean;
}

/** Filter chips — the categories people actually reach for under stress. */
const TYPES: { key: string; en: string; hi: string; icon: string }[] = [
  { key: '', en: 'All', hi: 'सभी', icon: '🆘' },
  { key: 'AMBULANCE', en: 'Ambulance', hi: 'एम्बुलेंस', icon: '🚑' },
  { key: 'HOSPITAL', en: 'Hospital', hi: 'अस्पताल', icon: '🏥' },
  { key: 'CHEMIST_24X7', en: 'Night chemist', hi: 'रात की दवा', icon: '💊' },
  { key: 'BLOOD_BANK', en: 'Blood bank', hi: 'ब्लड बैंक', icon: '🩸' },
  { key: 'FIRE_BRIGADE', en: 'Fire', hi: 'आग', icon: '🚒' },
  { key: 'POLICE', en: 'Police', hi: 'पुलिस', icon: '👮' },
  { key: 'GAS_LEAK', en: 'Gas leak', hi: 'गैस रिसाव', icon: '🔥' },
  { key: 'ELECTRICITY', en: 'Electricity', hi: 'बिजली', icon: '⚡' },
  { key: 'WATER_TANKER', en: 'Water tanker', hi: 'पानी टैंकर', icon: '🚰' },
  { key: 'VETERINARY', en: 'Cattle / pets', hi: 'पशु', icon: '🐄' },
  { key: 'WOMEN_HELPLINE', en: 'Women', hi: 'महिला', icon: '👩' },
  { key: 'CHILD_HELPLINE', en: 'Child', hi: 'बच्चे', icon: '🧒' },
  { key: 'DISASTER', en: 'Flood / disaster', hi: 'आपदा', icon: '🌊' },
];

/**
 * The emergency screen.
 *
 * Everything here is public and one tap from a phone number. In a kasba at 2am
 * the useful app is the one that shows a working number without a login, a
 * search or a map load — so the national helplines render from a constant list
 * the moment the page opens, and the network request only *adds* local numbers.
 */
@Component({
  selector: 'app-emergency',
  standalone: false,
  template: `
    <app-public-header [title]="'sos.title' | t"></app-public-header>
    <div class="container-lg px-0 px-md-2 pb-5">
      <div class="rf-sos-hero">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <h3>🆘 {{ 'sos.title' | t }}</h3>
            <p>{{ 'sos.subtitle' | t }}</p>
          </div>
          <button class="rf-lang-btn flex-shrink-0" (click)="i18n.toggleLang()">
            {{ i18n.lang() === 'en' ? 'हिं' : 'EN' }}
          </button>
        </div>
      </div>

      <!-- What to do before the call connects. Shown above the numbers because
           the first 30 seconds matter more than which number you dial. -->
      <div class="mb-3">
        <div class="rf-eyebrow mb-2">{{ 'sos.tips' | t }}</div>
        <div class="rf-tip" *ngFor="let tip of tips">
          <span>⚠️</span>
          <span>{{ i18n.lang() === 'hi' ? tip.hi : tip.en }}</span>
        </div>
      </div>

      <!-- National helplines: free, work everywhere, no balance needed. -->
      <div class="rf-eyebrow mb-2">{{ 'sos.national' | t }}</div>
      <div class="rf-sos-grid mb-4">
        <a class="rf-sos-call" *ngFor="let h of filteredNational" [href]="'tel:' + h.phone">
          <span class="rf-sos-call-ic">{{ iconFor(h.type) }}</span>
          <span class="flex-grow-1">
            <span class="rf-sos-num">{{ h.phone }}</span>
            <span class="rf-sos-name">{{ i18n.pick(h.name, h.nameLocal) }}</span>
          </span>
        </a>
      </div>

      <!-- Type filter -->
      <div class="rf-chips-scroll mb-3">
        <button class="rf-chip" *ngFor="let t of types" [class.active]="type === t.key"
                (click)="setType(t.key)">
          <span>{{ t.icon }}</span>{{ i18n.pick(t.en, t.hi) }}
        </button>
      </div>

      <!-- Local numbers -->
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="rf-eyebrow">{{ 'sos.local' | t }}</div>
        <button class="btn btn-sm btn-outline-primary" (click)="useGps()" [disabled]="locating">
          📍 {{ locating ? ('common.loading' | t) : ('common.search' | t) }}
        </button>
      </div>

      <div class="row g-2 mb-2">
        <div class="col-6 col-md-4">
          <input class="form-control" [(ngModel)]="city" name="sosCity"
                 [placeholder]="'common.city' | t" (keyup.enter)="load()">
        </div>
        <div class="col-6 col-md-3">
          <input class="form-control" [(ngModel)]="pincode" name="sosPin" inputmode="numeric"
                 [placeholder]="'common.pincode' | t" (keyup.enter)="load()">
        </div>
        <div class="col-12 col-md-2">
          <button class="btn btn-primary w-100" (click)="load()">{{ 'common.search' | t }}</button>
        </div>
      </div>

      <div class="rf-empty" *ngIf="!loading && !local.length">
        <span class="rf-empty-ic">📇</span>
        {{ 'sos.noLocal' | t }}
      </div>

      <div class="rf-shop" *ngFor="let c of local">
        <span class="rf-shop-ic">{{ iconFor(c.type) }}</span>
        <div class="rf-shop-main">
          <div class="rf-shop-name">
            {{ i18n.pick(c.name, c.nameLocal) }}
            <span class="rf-pill ok ms-1" *ngIf="c.verified">✓ {{ 'sos.verified' | t }}</span>
            <span class="rf-pill muted ms-1" *ngIf="!c.verified">{{ 'sos.unverified' | t }}</span>
            <span class="rf-pill info ms-1" *ngIf="c.is24x7">24×7</span>
          </div>
          <div class="rf-shop-sub" *ngIf="c.address || c.area || c.city">
            📍 {{ [c.address, c.area, c.city, c.pincode] | rfJoin }}
          </div>
          <div class="rf-shop-sub" *ngIf="c.notes">{{ c.notes }}</div>
          <div class="rf-shop-actions">
            <a class="btn btn-sm btn-call" [href]="'tel:' + c.phone">📞 {{ c.phone }}</a>
            <a class="btn btn-sm btn-outline-primary" *ngIf="c.altPhone" [href]="'tel:' + c.altPhone">
              📞 {{ c.altPhone }}
            </a>
          </div>
        </div>
      </div>

      <!-- 24x7 shops from the directory: the night chemist, the gas agency. -->
      <div *ngIf="openShops.length" class="mt-4">
        <div class="rf-eyebrow mb-2">{{ 'sos.open24' | t }}</div>
        <div class="rf-shop" *ngFor="let s of openShops">
          <span class="rf-shop-ic">{{ meta(s.category).icon }}</span>
          <div class="rf-shop-main">
            <div class="rf-shop-name">{{ i18n.pick(s.name, s.nameLocal) }}</div>
            <div class="rf-shop-sub">
              {{ i18n.pick(meta(s.category).en, meta(s.category).hi) }}
              <span *ngIf="s.address?.landmark"> · {{ s.address.landmark }}</span>
            </div>
            <div class="rf-shop-actions">
              <a class="btn btn-sm btn-call" *ngIf="s.phone" [href]="'tel:' + s.phone">
                📞 {{ 'common.call' | t }}
              </a>
              <a class="btn btn-sm btn-wa" *ngIf="s.whatsapp"
                 [href]="'https://wa.me/91' + last10(s.whatsapp)" target="_blank" rel="noopener">
                {{ 'common.whatsapp' | t }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Ask people nearby. Deliberately below the helplines, and labelled as
           an addition to a real emergency call, never a replacement. -->
      <div class="card mt-4" *ngIf="auth.isLoggedIn">
        <div class="card-header">{{ 'sos.raise' | t }}</div>
        <div class="card-body">
          <p class="small text-muted">{{ 'sos.raiseHint' | t }}</p>
          <div class="row g-2">
            <div class="col-md-4">
              <select class="form-select" [(ngModel)]="sos.type" name="sosType">
                <option *ngFor="let t of types.slice(1)" [value]="t.key">
                  {{ t.icon }} {{ i18n.pick(t.en, t.hi) }}
                </option>
              </select>
            </div>
            <div class="col-md-8">
              <input class="form-control" [(ngModel)]="sos.landmark" name="sosLm"
                     [placeholder]="'common.landmark' | t">
            </div>
            <div class="col-12">
              <input class="form-control" [(ngModel)]="sos.message" name="sosMsg"
                     placeholder="What happened? / क्या हुआ?">
            </div>
            <div class="col-12">
              <button class="btn btn-danger btn-lg w-100" (click)="raise()" [disabled]="sending">
                🆘 {{ sending ? ('common.loading' | t) : ('sos.raise' | t) }}
              </button>
            </div>
          </div>
          <div class="alert alert-success mt-2 mb-0 py-2 small" *ngIf="sent">
            {{ 'sos.sent' | t }}
          </div>
          <div class="alert alert-danger mt-2 mb-0 py-2 small" *ngIf="sosErr">
            {{ sosErr }}
          </div>
        </div>
      </div>

      <p class="text-center text-muted small mt-4 mb-0">
        <a routerLink="/shops">🏪 {{ 'nav.shops' | t }}</a>
        &nbsp;·&nbsp;
        <a [routerLink]="auth.isLoggedIn ? auth.home : '/'">{{ 'nav.home' | t }}</a>
      </p>
    </div>
  `,
})
export class EmergencyComponent implements OnInit {
  types = TYPES;
  type = '';
  city = '';
  pincode = '';
  loading = false;
  locating = false;
  sending = false;
  sent = false;
  sosErr = '';

  /** Rendered before any request finishes — see the class comment. */
  national: Helpline[] = FALLBACK_HELPLINES;
  local: LocalContact[] = [];
  openShops: any[] = [];
  tips: { en: string; hi: string }[] = FALLBACK_TIPS;

  sos = { type: 'AMBULANCE', message: '', landmark: '', lat: 0, lng: 0 };

  meta = categoryMeta;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    public i18n: I18nService,
  ) {}

  ngOnInit() {
    this.load();
    this.loadOpenShops();
  }

  get filteredNational(): Helpline[] {
    if (!this.type) return this.national;
    const hit = this.national.filter((h) => h.type === this.type);
    // 112 reaches everything, so never leave the user with an empty screen.
    return hit.length ? hit : this.national.filter((h) => h.phone === '112');
  }

  setType(key: string) {
    this.type = key;
    this.load();
  }

  private query(extra: Record<string, string | number> = {}) {
    const params: Record<string, any> = { ...extra };
    if (this.type) params['type'] = this.type;
    if (this.city) params['city'] = this.city;
    if (this.pincode) params['pincode'] = this.pincode;
    const qs = Object.entries(params)
      .filter(([, v]) => v !== '' && v != null)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
    return qs ? `?${qs}` : '';
  }

  load() {
    this.loading = true;
    this.api.get(`public/emergency${this.query()}`).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.national?.length) this.national = res.national;
        this.local = (res?.local || []).map(normalise);
        if (res?.safetyTips?.length) this.tips = res.safetyTips;
      },
      // Offline or API down: the constant helplines still stand.
      error: () => (this.loading = false),
    });
  }

  /** Nearest listings first, once the user shares GPS. */
  useGps() {
    if (!navigator.geolocation) return;
    this.locating = true;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        this.locating = false;
        this.sos.lat = p.coords.latitude;
        this.sos.lng = p.coords.longitude;
        const q = this.query({ lat: p.coords.latitude, lng: p.coords.longitude });
        this.api.get(`public/emergency/nearby${q}`).subscribe({
          next: (res: any) => {
            if (res?.national?.length) this.national = res.national;
            this.local = (res?.local || []).map(normalise);
          },
          error: () => {},
        });
        this.loadOpenShops(p.coords.latitude, p.coords.longitude);
      },
      () => (this.locating = false),
      { timeout: 8000 },
    );
  }

  /** Shops flagged for emergencies / open round the clock. */
  private loadOpenShops(lat?: number, lng?: number) {
    const url =
      lat != null && lng != null
        ? `public/shops/nearby?lat=${lat}&lng=${lng}&radius=15000&emergency=1&open=1`
        : 'public/shops?emergency=1&open=1';
    this.api.get(url).subscribe({
      next: (rows: any) => (this.openShops = (rows || []).slice(0, 12)),
      error: () => (this.openShops = []),
    });
  }

  raise() {
    this.sending = true;
    this.sent = false;
    this.sosErr = '';
    this.api
      .post('emergency/sos', {
        type: this.sos.type,
        message: this.sos.message,
        landmark: this.sos.landmark,
        name: this.auth.currentUser?.name,
        phone: this.auth.currentUser?.phone,
        ...(this.sos.lat ? { lat: this.sos.lat, lng: this.sos.lng } : {}),
      })
      .subscribe({
        next: () => {
          this.sending = false;
          this.sent = true;
          this.sos.message = '';
        },
        error: (e) => {
          this.sending = false;
          // Safety action — never fail silently. Tell them to call directly.
          this.sosErr =
            e?.error?.message ||
            (this.i18n.lang() === 'hi'
              ? 'संदेश नहीं भेजा जा सका — कृपया सीधे नंबर पर कॉल करें।'
              : "Couldn't send — please call a number above directly.");
        },
      });
  }

  iconFor(type: string): string {
    return (
      {
        AMBULANCE: '🚑',
        HOSPITAL: '🏥',
        CHEMIST_24X7: '💊',
        BLOOD_BANK: '🩸',
        FIRE_BRIGADE: '🚒',
        POLICE: '👮',
        GAS_LEAK: '🔥',
        ELECTRICITY: '⚡',
        WATER_TANKER: '🚰',
        VETERINARY: '🐄',
        WOMEN_HELPLINE: '👩',
        CHILD_HELPLINE: '🧒',
        DISASTER: '🌊',
        MUNICIPALITY: '🏛️',
        TOWING: '🛻',
      }[type] || '🆘'
    );
  }

  last10(phone: string): string {
    const d = String(phone || '').replace(/\D/g, '');
    return d.length > 10 ? d.slice(-10) : d;
  }
}

function normalise(c: any): LocalContact {
  return { ...c, id: c.id ?? c._id };
}

/**
 * Mirrors the backend constants so the screen is useful even before (or
 * without) a successful API call. Deliberately duplicated: an emergency page
 * that renders nothing when the network is down has failed at its one job.
 */
const FALLBACK_HELPLINES: Helpline[] = [
  { type: 'OTHER', name: 'Emergency (all services)', nameLocal: 'आपातकालीन नंबर', phone: '112', notes: '' },
  { type: 'AMBULANCE', name: 'Ambulance', nameLocal: 'एम्बुलेंस', phone: '108', notes: '' },
  { type: 'FIRE_BRIGADE', name: 'Fire brigade', nameLocal: 'दमकल', phone: '101', notes: '' },
  { type: 'POLICE', name: 'Police', nameLocal: 'पुलिस', phone: '100', notes: '' },
  { type: 'HOSPITAL', name: 'Medical helpline', nameLocal: 'स्वास्थ्य हेल्पलाइन', phone: '104', notes: '' },
  { type: 'GAS_LEAK', name: 'LPG gas leak', nameLocal: 'गैस रिसाव', phone: '1906', notes: '' },
  { type: 'ELECTRICITY', name: 'Electricity fault', nameLocal: 'बिजली शिकायत', phone: '1912', notes: '' },
  { type: 'WOMEN_HELPLINE', name: 'Women helpline', nameLocal: 'महिला हेल्पलाइन', phone: '1091', notes: '' },
  { type: 'CHILD_HELPLINE', name: 'Child helpline', nameLocal: 'चाइल्डलाइन', phone: '1098', notes: '' },
  { type: 'DISASTER', name: 'Disaster control room', nameLocal: 'आपदा प्रबंधन', phone: '1077', notes: '' },
  { type: 'VETERINARY', name: 'Cattle ambulance', nameLocal: 'पशु एम्बुलेंस', phone: '1962', notes: '' },
];

const FALLBACK_TIPS = [
  {
    en: 'Gas smell: close the regulator, open doors, do not touch any switch, then call 1906.',
    hi: 'गैस की गंध: रेगुलेटर बंद करें, दरवाज़े खोलें, कोई स्विच न दबाएँ, फिर 1906 पर कॉल करें।',
  },
  {
    en: 'Say the landmark, not the address — an ambulance finds "near the bus stand" faster than a house number.',
    hi: 'पता नहीं, लैंडमार्क बताएँ — "बस स्टैंड के पास" से एम्बुलेंस जल्दी पहुँचती है।',
  },
];
