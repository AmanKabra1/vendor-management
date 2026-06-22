import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { TrackingService } from '../shared/tracking.service';

@Component({
  selector: 'app-rider-dashboard',
  standalone: false,
  template: `
    <h3 class="mb-4">Rider Hub</h3>

    <app-kyc></app-kyc>


    <!-- No profile yet -->
    <div *ngIf="!rider" class="card border-0 shadow-sm mb-4" style="max-width:560px">
      <div class="card-header bg-white fw-semibold">Set up your rider profile</div>
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-5">
            <select class="form-select" [(ngModel)]="profileForm.vehicleType">
              <option>MOTORCYCLE</option><option>SCOOTER</option><option>BICYCLE</option><option>CAR</option><option>VAN</option>
            </select>
          </div>
          <div class="col-md-4"><input class="form-control" placeholder="License no." [(ngModel)]="profileForm.licenseNumber"></div>
          <div class="col-md-3"><button class="btn btn-primary w-100" (click)="createProfile()">Create</button></div>
        </div>
      </div>
    </div>

    <div *ngIf="rider">
      <!-- Status bar -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body d-flex flex-wrap align-items-center gap-3">
          <div>
            <div class="text-muted small">Status</div>
            <span class="badge" [ngClass]="rider.isApproved ? 'bg-success' : 'bg-warning text-dark'">
              {{ rider.isApproved ? 'Approved' : 'Awaiting approval' }}
            </span>
          </div>
          <div>
            <div class="text-muted small">Deliveries</div>
            <strong>{{ rider.totalDeliveries }}</strong>
          </div>
          <div class="ms-auto d-flex align-items-center gap-2">
            <span class="text-muted small">Availability</span>
            <select class="form-select" style="width:auto" [(ngModel)]="rider.availability" (change)="setAvailability()">
              <option>OFFLINE</option><option>AVAILABLE</option><option>ON_BREAK</option><option>ON_DELIVERY</option>
            </select>
          </div>
        </div>

        <!-- Location row -->
        <div class="card-footer bg-white">
          <label class="form-label small mb-1">My current location (riders need this to receive nearby orders)</label>
          <app-location-picker [lat]="loc.lat" [lng]="loc.lng" (locationChange)="onRiderLoc($event)"></app-location-picker>
          <span class="small" [class.text-success]="locMsg.startsWith('Saved')" [class.text-danger]="locMsg.startsWith('Could')">{{ locMsg }}</span>
          <div class="small text-muted mt-2" *ngIf="!rider.isApproved">
            You can set availability & location, but you'll only receive orders once an admin approves you.
          </div>
        </div>
      </div>

      <!-- Assigned orders -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white fw-semibold">My deliveries</div>
        <div class="table-responsive">
          <table class="table align-middle mb-0">
            <thead class="table-light"><tr><th>Order #</th><th>Pickup</th><th>Drop</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr *ngFor="let o of orders">
                <td class="small fw-semibold">{{ o.orderNumber }}</td>
                <td class="small">{{ o.pickupLocation?.address || '—' }}</td>
                <td class="small">{{ o.dropLocation?.address || o.customer?.address || '—' }}</td>
                <td><span class="badge bg-secondary">{{ o.status }}</span></td>
                <td class="text-nowrap">
                  <button class="btn btn-sm btn-success me-1" *ngIf="o.status==='RIDER_ASSIGNED'" (click)="act(o,'accept')">Accept</button>
                  <button class="btn btn-sm btn-outline-danger me-1" *ngIf="o.status==='RIDER_ASSIGNED'" (click)="act(o,'reject')">Reject</button>
                  <button class="btn btn-sm btn-primary me-1" *ngIf="o.status==='RIDER_ASSIGNED'" (click)="act(o,'pickup')">Picked up</button>
                  <button class="btn btn-sm btn-success me-1" *ngIf="o.status==='PICKED_UP' || o.status==='IN_TRANSIT'" (click)="deliver(o)">Deliver (OTP)</button>
                  <button class="btn btn-sm" [class.btn-outline-info]="liveOrderId!==o.id" [class.btn-info]="liveOrderId===o.id"
                          *ngIf="o.status==='PICKED_UP' || o.status==='IN_TRANSIT' || o.status==='RIDER_ASSIGNED'"
                          (click)="toggleLive(o)">
                    {{ liveOrderId===o.id ? '⏹ Live' : '📡 Go Live' }}
                  </button>
                </td>
              </tr>
              <tr *ngIf="!orders.length"><td colspan="5" class="text-center text-muted py-3">No deliveries assigned.</td></tr>
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
  liveOrderId: string | null = null;
  private liveTimer: any = null;
  private liveLat = 28.61;
  private liveLng = 77.2;

  constructor(private api: ApiService, private tracking: TrackingService) {}

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
      this.locMsg = 'Could not save — enter valid lat/lng';
      return;
    }
    this.locMsg = 'Saving…';
    this.api.patch(`riders/${this.rider.id}/location`, { lat, lng }).subscribe({
      next: () => {
        this.locMsg = `Saved ✓ (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        this.load();
      },
      error: () => (this.locMsg = 'Could not save location'),
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
    const otp = prompt('Enter delivery OTP from the customer:') || '';
    if (!otp) return;
    this.api.patch(`orders/${o.id}/deliver`, { otp }).subscribe({
      next: () => this.load(),
      error: (e) => alert(e?.error?.message || 'Delivery failed'),
    });
  }
}
