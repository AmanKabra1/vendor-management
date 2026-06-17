import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';

@Component({
  selector: 'app-rider-dashboard',
  standalone: false,
  template: `
    <h3 class="mb-4">Rider Hub</h3>

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
            <button class="btn btn-sm btn-outline-secondary" (click)="updateLocation()">📍 Set my location</button>
          </div>
        </div>
        <div class="card-footer bg-white small text-muted" *ngIf="!rider.isApproved">
          You can go AVAILABLE, but you'll only receive orders once an admin approves you.
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
                  <button class="btn btn-sm btn-success" *ngIf="o.status==='PICKED_UP' || o.status==='IN_TRANSIT'" (click)="deliver(o)">Deliver (OTP)</button>
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
export class RiderDashboardComponent implements OnInit {
  rider: any = null;
  orders: any[] = [];
  profileForm = { vehicleType: 'MOTORCYCLE', licenseNumber: '' };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.get('riders').subscribe((r) => (this.rider = r[0] || null));
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

  updateLocation() {
    // Use browser geolocation when available, else a Delhi default for testing.
    const send = (lat: number, lng: number) =>
      this.api.patch(`riders/${this.rider.id}/location`, { lat, lng }).subscribe(() => this.load());
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => send(p.coords.latitude, p.coords.longitude),
        () => send(28.61, 77.2),
      );
    } else {
      send(28.61, 77.2);
    }
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
