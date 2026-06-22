import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface LiveLocation {
  orderId: string;
  lat: number;
  lng: number;
  at: number;
}

/**
 * Live order tracking via polling (works on serverless hosting where
 * websockets aren't available). Keeps the same API the components already use:
 * joinOrder / sendLocation / onLocation / onStatus / disconnect.
 *
 * - Watchers: joinOrder() polls GET track/:id every few seconds and fires the
 *   onStatus/onLocation callbacks when something changes.
 * - Riders: sendLocation() POSTs GPS to the backend; watchers see it next poll.
 */
@Injectable({ providedIn: 'root' })
export class TrackingService {
  private orderId = '';
  private timer: any = null;
  private locationCb?: (loc: LiveLocation) => void;
  private statusCb?: (s: { orderId: string; status: string }) => void;
  private lastStatus = '';
  private readonly intervalMs = 5000;

  constructor(private api: ApiService) {}

  joinOrder(orderId: string) {
    this.orderId = orderId;
    this.lastStatus = '';
    this.stopTimer();
    this.poll();
    this.timer = setInterval(() => this.poll(), this.intervalMs);
  }

  sendLocation(orderId: string, lat: number, lng: number) {
    this.api.post(`orders/${orderId}/location`, { lat, lng }).subscribe({ error: () => {} });
  }

  onLocation(cb: (loc: LiveLocation) => void) {
    this.locationCb = cb;
  }

  onStatus(cb: (s: { orderId: string; status: string }) => void) {
    this.statusCb = cb;
  }

  disconnect() {
    this.stopTimer();
    this.orderId = '';
    this.locationCb = undefined;
    this.statusCb = undefined;
    this.lastStatus = '';
  }

  private poll() {
    if (!this.orderId) return;
    const id = this.orderId;
    this.api.get(`track/${id}`).subscribe({
      next: (d: any) => {
        if (d?.status && d.status !== this.lastStatus) {
          this.lastStatus = d.status;
          this.statusCb?.({ orderId: id, status: d.status });
        }
        const loc = d?.liveLocation;
        if (loc && loc.lat != null && loc.lng != null) {
          this.locationCb?.({ orderId: id, lat: loc.lat, lng: loc.lng, at: +new Date(loc.at) || 0 });
        }
      },
      error: () => {},
    });
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
