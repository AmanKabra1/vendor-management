import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../shared/api.service';
import { TrackingService } from '../shared/tracking.service';
import { MapMarker } from '../shared/map.component';

@Component({
  selector: 'app-track',
  standalone: false,
  template: `
    <div class="track-wrap">
      <div class="card shadow-sm track-card">
        <div class="card-header bg-primary text-white">
          <div class="d-flex justify-content-between align-items-center">
            <span class="fw-bold">📦 Track your order</span>
            <span class="small">{{ info?.orderNumber }}</span>
          </div>
        </div>

        <div *ngIf="error" class="alert alert-danger m-3">{{ error }}</div>

        <div *ngIf="info">
          <!-- progress steps -->
          <div class="px-3 pt-3">
            <div class="d-flex justify-content-between text-center small">
              <div *ngFor="let s of steps" class="flex-fill">
                <div class="dot mx-auto" [class.done]="isReached(s.key)"></div>
                <div [class.fw-bold]="info.status===s.key" [class.text-muted]="!isReached(s.key)">{{ s.label }}</div>
              </div>
            </div>
          </div>

          <app-map [markers]="markers" [center]="center" height="300px"></app-map>

          <div class="card-body">
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Status</span>
              <span class="badge bg-primary">{{ pretty(info.status) }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">From</span><span>{{ info.storeName }}</span>
            </div>
            <div class="d-flex justify-content-between mb-3">
              <span class="text-muted">Rider</span><span>{{ liveRiderName || info.riderName || 'Awaiting assignment' }}</span>
            </div>

            <h6 class="text-muted">Timeline</h6>
            <ul class="list-unstyled timeline mb-0">
              <li *ngFor="let t of (info.timeline || []).slice().reverse()">
                <span class="badge bg-light text-dark me-2">{{ pretty(t.status) }}</span>
                <small class="text-muted">{{ t.at | date: 'short' }} · {{ t.note }}</small>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `.track-wrap{min-height:100vh;background:#f4f6fa;display:flex;justify-content:center;padding:1.5rem}`,
    `.track-card{width:100%;max-width:560px;overflow:hidden}`,
    `.dot{width:14px;height:14px;border-radius:50%;background:#ced4da;margin-bottom:4px}`,
    `.dot.done{background:#0d6efd}`,
    `.timeline li{padding:4px 0;border-bottom:1px solid #f0f0f0}`,
  ],
})
export class TrackComponent implements OnInit, OnDestroy {
  id = '';
  info: any = null;
  error = '';
  markers: MapMarker[] = [];
  center: [number, number] = [28.61, 77.2];
  liveRiderName = '';

  steps = [
    { key: 'RIDER_ASSIGNED', label: 'Assigned' },
    { key: 'PICKED_UP', label: 'Picked up' },
    { key: 'IN_TRANSIT', label: 'On the way' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];
  private order = ['CREATED', 'RIDER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private tracking: TrackingService,
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.api.get(`track/${this.id}`).subscribe({
      next: (d) => {
        this.info = d;
        this.buildMarkers();
        this.tracking.joinOrder(this.id);
        this.tracking.onLocation((loc) => {
          if (loc.orderId !== this.id) return;
          this.setRider(loc.lat, loc.lng);
        });
        this.tracking.onStatus((s) => {
          if (s.orderId === this.id) this.info.status = s.status;
        });
      },
      error: () => (this.error = 'Order not found or no longer available.'),
    });
  }

  ngOnDestroy() {
    this.tracking.disconnect();
  }

  isReached(key: string) {
    return this.order.indexOf(this.info?.status) >= this.order.indexOf(key);
  }
  pretty(s: string) {
    return (s || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  }

  private buildMarkers() {
    const m: MapMarker[] = [];
    const p = this.info.pickupLocation;
    const d = this.info.dropLocation;
    if (p?.lat != null) m.push({ lat: p.lat, lng: p.lng, label: this.info.storeName || 'Pickup', color: '#0d6efd' });
    if (d?.lat != null) m.push({ lat: d.lat, lng: d.lng, label: 'Drop', color: '#dc3545' });
    const rc = this.info.riderLocation?.coordinates;
    if (rc?.length === 2 && rc[0] !== 0) m.push({ lat: rc[1], lng: rc[0], label: 'Rider', color: '#198754' });
    if (m.length) this.center = [m[0].lat, m[0].lng];
    this.markers = m;
  }

  private setRider(lat: number, lng: number) {
    const others = this.markers.filter((x) => x.label !== 'Rider');
    this.markers = [...others, { lat, lng, label: 'Rider', color: '#198754' }];
  }
}
