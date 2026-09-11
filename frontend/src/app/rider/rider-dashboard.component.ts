import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { TrackingService } from '../shared/tracking.service';
import { I18nService } from '../shared/i18n.service';

@Component({
  selector: 'app-rider-dashboard',
  standalone: false,
  template: `
    <h3 class="mb-4">{{ 'rider.title' | t }}</h3>

    <app-kyc></app-kyc>


    <!-- No profile yet -->
    <div *ngIf="!rider" class="card border-0 shadow-sm mb-4" style="max-width:560px">
      <div class="card-header bg-white fw-semibold">{{ 'rider.setup' | t }}</div>
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-5">
            <select class="form-select" [(ngModel)]="profileForm.vehicleType">
              <option>MOTORCYCLE</option><option>SCOOTER</option><option>BICYCLE</option><option>CAR</option><option>VAN</option>
            </select>
          </div>
          <div class="col-md-4"><input class="form-control" [placeholder]="'rider.license' | t" [(ngModel)]="profileForm.licenseNumber"></div>
          <div class="col-md-3"><button class="btn btn-primary w-100" (click)="createProfile()">{{ 'common.create' | t }}</button></div>
        </div>
      </div>
    </div>

    <div *ngIf="rider">
      <!-- Status bar -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body d-flex flex-wrap align-items-center gap-3">
          <div>
            <div class="text-muted small">{{ 'common.status' | t }}</div>
            <span class="badge" [ngClass]="rider.isApproved ? 'bg-success' : 'bg-warning text-dark'">
              {{ (rider.isApproved ? 'common.approved' : 'rider.awaiting') | t }}
            </span>
          </div>
          <div>
            <div class="text-muted small">{{ 'rider.deliveries' | t }}</div>
            <strong>{{ rider.totalDeliveries }}</strong>
          </div>
          <div class="ms-auto d-flex align-items-center gap-2">
            <span class="text-muted small">{{ 'rider.availability' | t }}</span>
            <select class="form-select" style="width:auto" [(ngModel)]="rider.availability" (change)="setAvailability()">
              <option>OFFLINE</option><option>AVAILABLE</option><option>ON_BREAK</option><option>ON_DELIVERY</option>
            </select>
          </div>
        </div>

        <!-- Location row -->
        <div class="card-footer bg-white">
          <label class="form-label small mb-1">{{ 'rider.location' | t }}</label>
          <app-location-picker [lat]="loc.lat" [lng]="loc.lng" (locationChange)="onRiderLoc($event)"></app-location-picker>
          <span class="small" [class.text-success]="locState==='ok'" [class.text-danger]="locState==='err'">{{ locMsg }}</span>
          <div class="small text-muted mt-2" *ngIf="!rider.isApproved">
            {{ 'rider.approvalNote' | t }}
          </div>
        </div>
      </div>

      <!-- Help requests nearby -----------------------------------------
           A rider is already out on the road with a vehicle and a phone, so
           they are often the fastest responder in a small town. Shown only
           when something is actually open, so it never becomes noise. -->
      <div class="card border-0 shadow-sm mb-4" *ngIf="sosAlerts.length">
        <div class="card-header bg-danger text-white fw-semibold d-flex justify-content-between">
          <span>🆘 {{ 'sos.alerts' | t }}</span>
          <span class="badge bg-light text-danger">{{ sosAlerts.length }}</span>
        </div>
        <ul class="list-group list-group-flush">
          <li class="list-group-item d-flex justify-content-between align-items-start gap-2 flex-wrap"
              *ngFor="let a of sosAlerts">
            <span>
              <span class="fw-semibold">{{ a.type }}</span> — {{ a.message || '—' }}
              <small class="d-block text-muted">
                📍 {{ a.landmark || a.address || '—' }} · {{ a.createdAt | date: 'short' }}
              </small>
            </span>
            <span class="d-flex gap-1">
              <a class="btn btn-sm btn-call" *ngIf="a.phone || a.raisedBy?.phone"
                 [href]="'tel:' + (a.phone || a.raisedBy?.phone)">📞</a>
              <button class="btn btn-sm btn-outline-danger" *ngIf="a.status === 'OPEN'"
                      (click)="ackAlert(a)">{{ 'sos.acknowledge' | t }}</button>
              <button class="btn btn-sm btn-outline-success" (click)="resolveAlert(a)">
                {{ 'sos.resolve' | t }}
              </button>
            </span>
          </li>
        </ul>
        <div class="card-footer bg-white small text-muted">
          <a routerLink="/emergency">{{ 'nav.emergency' | t }} →</a>
        </div>
      </div>

      <!-- Assigned orders -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white fw-semibold">{{ 'rider.myDeliveries' | t }}</div>
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead class="table-light"><tr><th>{{ 'common.orderNo' | t }}</th><th>{{ 'rider.pickup' | t }}</th><th>{{ 'rider.drop' | t }}</th><th>{{ 'common.status' | t }}</th><th>{{ 'common.action' | t }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let o of orders">
                <td class="small fw-semibold">{{ o.orderNumber }}</td>
                <td class="small">{{ o.pickupLocation?.address || '—' }}</td>
                <td class="small">{{ o.dropLocation?.address || o.customer?.address || '—' }}</td>
                <td><span class="badge bg-secondary">{{ o.status }}</span></td>
                <td class="text-nowrap">
                  <button class="btn btn-sm btn-success me-1" *ngIf="o.status==='RIDER_ASSIGNED'" (click)="act(o,'accept')">{{ 'rider.accept' | t }}</button>
                  <button class="btn btn-sm btn-outline-danger me-1" *ngIf="o.status==='RIDER_ASSIGNED'" (click)="act(o,'reject')">{{ 'common.reject' | t }}</button>
                  <button class="btn btn-sm btn-primary me-1" *ngIf="o.status==='RIDER_ASSIGNED'" (click)="act(o,'pickup')">{{ 'rider.pickedUp' | t }}</button>
                  <button class="btn btn-sm btn-success me-1" *ngIf="o.status==='PICKED_UP' || o.status==='IN_TRANSIT'" (click)="deliver(o)">{{ 'rider.deliverOtp' | t }}</button>
                  <button class="btn btn-sm" [class.btn-outline-info]="liveOrderId!==o.id" [class.btn-info]="liveOrderId===o.id"
                          *ngIf="o.status==='PICKED_UP' || o.status==='IN_TRANSIT' || o.status==='RIDER_ASSIGNED'"
                          (click)="toggleLive(o)">
                    {{ liveOrderId===o.id ? ('⏹ ' + ('rider.live' | t)) : ('📡 ' + ('rider.goLive' | t)) }}
                  </button>
                </td>
              </tr>
              <tr *ngIf="!orders.length"><td colspan="5" class="text-center text-muted py-3">{{ 'rider.noDeliveries' | t }}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class RiderDashboardComponent implements OnInit, OnDestroy {
  rider: any = null;
  orders: any[] = [];
  profileForm = { vehicleType: 'MOTORCYCLE', licenseNumber: '' };
  loc = { lat: 28.61, lng: 77.2 };
  locMsg = '';
  /** Styling flag for the location message, language-independent. */
  locState: '' | 'ok' | 'err' = '';
  liveOrderId: string | null = null;
  /** Open help requests near this rider (see the SOS card in the template). */
  sosAlerts: any[] = [];
  private liveTimer: any = null;
  private liveLat = 28.61;
  private liveLng = 77.2;

  constructor(
    private api: ApiService,
    private tracking: TrackingService,
    private i18n: I18nService,
  ) {}

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    this.stopLive();
  }

  /** Toggle broadcasting GPS for an active delivery every 4s. */
  toggleLive(o: any) {
    if (this.liveOrderId === o.id) {
      this.stopLive();
      return;
    }
    this.stopLive();
    this.liveOrderId = o.id;
    this.tracking.joinOrder(o.id);
    const tick = () => {
      const push = (lat: number, lng: number) => {
        this.liveLat = lat;
        this.liveLng = lng;
        this.tracking.sendLocation(o.id, lat, lng);
      };
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (p) => push(p.coords.latitude, p.coords.longitude),
          // Fallback: nudge the marker so movement is visible while testing.
          () => push(this.liveLat + (Math.random() - 0.5) * 0.002, this.liveLng + (Math.random() - 0.5) * 0.002),
        );
      } else {
        push(this.liveLat + (Math.random() - 0.5) * 0.002, this.liveLng + (Math.random() - 0.5) * 0.002);
      }
    };
    tick();
    this.liveTimer = setInterval(tick, 4000);
  }

  stopLive() {
    if (this.liveTimer) clearInterval(this.liveTimer);
    this.liveTimer = null;
    this.liveOrderId = null;
  }

  load() {
    this.api.get('riders').subscribe((r) => {
      this.rider = r[0] || null;
      const c = this.rider?.currentLocation?.coordinates;
      if (c?.length === 2 && (c[0] || c[1])) {
        this.loc = { lat: c[1], lng: c[0] };
      }
    });
    this.api.get('orders').subscribe((o) => (this.orders = o));
    this.loadAlerts();
  }

  /** Help requests near this rider — scoped by GPS when we have it. */
  loadAlerts() {
    const q = this.loc.lat ? `?lat=${this.loc.lat}&lng=${this.loc.lng}` : '';
    this.api.get(`emergency/sos${q}`).subscribe({
      next: (a: any) => (this.sosAlerts = (a || []).map((x: any) => ({ ...x, id: x.id ?? x._id }))),
      error: () => (this.sosAlerts = []),
    });
  }

  ackAlert(a: any) {
    this.api.patch(`emergency/sos/${a.id}/acknowledge`, {}).subscribe(() => this.loadAlerts());
  }

  resolveAlert(a: any) {
    this.api.patch(`emergency/sos/${a.id}/resolve`, {}).subscribe(() => this.loadAlerts());
  }

  createProfile() {
    this.api.post('riders/register', this.profileForm).subscribe(() => this.load());
  }

  setAvailability() {
    this.api
      .patch(`riders/${this.rider.id}/availability`, { availability: this.rider.availability })
      .subscribe();
  }

  /** Save the lat/lng currently in the inputs. */
  saveLocation() {
    const lat = Number(this.loc.lat);
    const lng = Number(this.loc.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      this.locMsg = this.i18n.t('rider.saveInvalid');
      this.locState = 'err';
      return;
    }
    this.locMsg = this.i18n.t('common.loading');
    this.locState = '';
    this.api.patch(`riders/${this.rider.id}/location`, { lat, lng }).subscribe({
      next: () => {
        this.locMsg = `${this.i18n.t('common.save')} ✓ (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        this.locState = 'ok';
        this.load();
      },
      error: () => {
        this.locMsg = this.i18n.t('rider.saveFailed');
        this.locState = 'err';
      },
    });
  }

  /** Picker emitted a coordinate (address search / GPS / manual) — save it. */
  onRiderLoc(e: { lat: number; lng: number }) {
    this.loc = { lat: e.lat, lng: e.lng };
    this.saveLocation();
  }

  act(o: any, action: 'accept' | 'reject' | 'pickup') {
    this.api.patch(`orders/${o.id}/${action}`).subscribe(() => this.load());
  }

  deliver(o: any) {
    const otp = prompt(this.i18n.t('rider.otpPrompt')) || '';
    if (!otp) return;
    this.api.patch(`orders/${o.id}/deliver`, { otp }).subscribe({
      next: () => this.load(),
      error: (e) => alert(e?.error?.message || this.i18n.t('rider.deliverFailed')),
    });
  }
}
