import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { MapMarker } from '../shared/map.component';
import { TrackingService } from '../shared/tracking.service';

@Component({
  selector: 'app-store-dashboard',
  standalone: false,
  template: `
    <h3 class="mb-4">My Store &amp; Orders</h3>

    <!-- No store yet -->
    <div *ngIf="!stores.length" class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-white fw-semibold">Create your store</div>
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-4"><input class="form-control" placeholder="Store name" [(ngModel)]="storeForm.name"></div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="storeForm.category">
              <option>GROCERY</option><option>RESTAURANT</option><option>PHARMACY</option><option>GENERAL</option><option>OTHER</option>
            </select>
          </div>
          <div class="col-md-2"><input class="form-control" placeholder="Lat" type="number" [(ngModel)]="storeForm.lat"></div>
          <div class="col-md-2"><input class="form-control" placeholder="Lng" type="number" [(ngModel)]="storeForm.lng"></div>
          <div class="col-md-1"><button class="btn btn-primary w-100" (click)="createStore()">Add</button></div>
        </div>
        <small class="text-muted">Tip: Delhi ≈ lat 28.61, lng 77.20. Store needs admin approval before you can hire riders.</small>
      </div>
    </div>

    <!-- Has store -->
    <div *ngIf="store" class="row g-4">
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <h5 class="mb-1">{{ store.name }}</h5>
              <span class="badge" [ngClass]="store.status==='APPROVED' ? 'bg-success' : 'bg-warning text-dark'">{{ store.status }}</span>
            </div>
            <div class="text-muted small mb-2">{{ store.category }} · {{ store.totalOrders }} orders</div>
          </div>
        </div>

        <div class="card border-0 shadow-sm mt-3">
          <div class="card-header bg-white fw-semibold">New delivery order</div>
          <div class="card-body">
            <input class="form-control mb-2" placeholder="Customer name" [(ngModel)]="orderForm.cname">
            <input class="form-control mb-2" placeholder="Customer phone" [(ngModel)]="orderForm.cphone">
            <input class="form-control mb-2" placeholder="Drop address" [(ngModel)]="orderForm.caddr">
            <input class="form-control mb-2" placeholder="Item" [(ngModel)]="orderForm.item">
            <input class="form-control mb-2" placeholder="Amount" type="number" [(ngModel)]="orderForm.amount">
            <button class="btn btn-primary w-100" (click)="createOrder()" [disabled]="store.status!=='APPROVED'">
              Create order
            </button>
            <small *ngIf="store.status!=='APPROVED'" class="text-danger">Store must be approved first.</small>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white fw-semibold">Orders</div>
          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead class="table-light"><tr><th>Order #</th><th>Customer</th><th>Status</th><th>Rider</th><th>Action</th></tr></thead>
              <tbody>
                <tr *ngFor="let o of orders">
                  <td class="small fw-semibold">{{ o.orderNumber }}</td>
                  <td>{{ o.customer?.name }}</td>
                  <td><span class="badge bg-secondary">{{ o.status }}</span></td>
                  <td>{{ o.rider?.user?.name || '—' }}</td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary me-1" *ngIf="o.status==='CREATED'" (click)="openAssign(o)">Find rider</button>
                    <button class="btn btn-sm btn-outline-info me-1" *ngIf="o.rider && o.status!=='DELIVERED' && o.status!=='CANCELLED'" (click)="track(o)">Track</button>
                    <span *ngIf="o.otp && o.status!=='DELIVERED'" class="badge bg-info text-dark">OTP {{ o.otp }}</span>
                  </td>
                </tr>
                <tr *ngIf="!orders.length"><td colspan="5" class="text-center text-muted py-3">No orders yet.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign rider modal -->
    <div class="modal-back" *ngIf="assigning" (click)="assigning=null">
      <div class="card shadow" style="max-width:560px;width:100%" (click)="$event.stopPropagation()">
        <div class="card-header bg-white fw-semibold">Nearby available riders</div>
        <app-map [markers]="riderMarkers" [center]="storeCenter" height="240px"></app-map>
        <ul class="list-group list-group-flush">
          <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let r of nearbyRiders">
            <span>{{ r.user?.name || 'Rider' }} <small class="text-muted">· {{ r.vehicleType }}</small></span>
            <button class="btn btn-sm btn-success" (click)="assign(r)">Assign</button>
          </li>
          <li class="list-group-item text-muted text-center" *ngIf="!nearbyRiders.length">No available riders nearby.</li>
        </ul>
        <div class="card-footer bg-white text-end"><button class="btn btn-light" (click)="assigning=null">Close</button></div>
      </div>
    </div>

    <!-- Live tracking modal -->
    <div class="modal-back" *ngIf="tracking" (click)="closeTrack()">
      <div class="card shadow" style="max-width:560px;width:100%" (click)="$event.stopPropagation()">
        <div class="card-header bg-white fw-semibold d-flex justify-content-between">
          <span>Tracking {{ tracking.orderNumber }}</span>
          <span class="badge bg-secondary">{{ trackStatus }}</span>
        </div>
        <app-map [markers]="trackMarkers" [center]="storeCenter" height="280px"></app-map>
        <div class="card-body py-2 small text-muted">
          {{ trackMarkers.length > 1 ? 'Live rider position updates as they move.' : 'Waiting for rider to go live…' }}
        </div>
        <div class="card-footer bg-white d-flex justify-content-between">
          <button class="btn btn-outline-secondary btn-sm" (click)="copyTrackLink()">🔗 Copy customer link</button>
          <button class="btn btn-light" (click)="closeTrack()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`.modal-back{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:1050;padding:1rem}`],
})
export class StoreDashboardComponent implements OnInit {
  stores: any[] = [];
  store: any = null;
  orders: any[] = [];
  storeForm = { name: '', category: 'GROCERY', lat: 28.61, lng: 77.2 };
  orderForm = { cname: '', cphone: '', caddr: '', item: '', amount: 0 };
  assigning: any = null;
  nearbyRiders: any[] = [];
  storeCenter: [number, number] = [28.61, 77.2];
  riderMarkers: MapMarker[] = [];
  tracking: any = null;
  trackStatus = '';
  trackMarkers: MapMarker[] = [];

  constructor(private api: ApiService, private track$: TrackingService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.get('stores').subscribe((s) => {
      this.stores = s;
      this.store = s[0] || null;
    });
    this.api.get('orders').subscribe((o) => (this.orders = o));
  }

  createStore() {
    this.api.post('stores', this.storeForm).subscribe(() => this.load());
  }

  createOrder() {
    const body = {
      store: this.store.id,
      customer: { name: this.orderForm.cname, phone: this.orderForm.cphone, address: this.orderForm.caddr },
      items: [{ name: this.orderForm.item, quantity: 1, price: this.orderForm.amount }],
      totalAmount: this.orderForm.amount,
      paymentMethod: 'COD',
    };
    this.api.post('orders', body).subscribe(() => {
      this.orderForm = { cname: '', cphone: '', caddr: '', item: '', amount: 0 };
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
        this.nearbyRiders = r;
        this.riderMarkers = [
          { lat, lng, label: this.store.name, color: '#0d6efd' },
          ...r
            .filter((x: any) => x.currentLocation?.coordinates?.length === 2)
            .map((x: any) => ({
              lat: x.currentLocation.coordinates[1],
              lng: x.currentLocation.coordinates[0],
              label: x.user?.name || 'Rider',
              color: '#198754',
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
    this.trackMarkers = [{ lat, lng, label: this.store.name, color: '#0d6efd' }];
    this.track$.joinOrder(o.id);
    this.track$.onLocation((loc) => {
      if (loc.orderId !== this.tracking?.id) return;
      // Keep the store pin, replace the rider pin with the live position.
      this.trackMarkers = [
        this.trackMarkers[0],
        { lat: loc.lat, lng: loc.lng, label: 'Rider', color: '#198754' },
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
    alert('Customer tracking link copied:\n' + url);
  }
}
