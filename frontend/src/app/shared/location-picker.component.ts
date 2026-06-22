import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface PickedLocation {
  lat: number;
  lng: number;
  address?: string;
}

/**
 * Friendly location chooser — most people don't know their lat/lng, so:
 *  1) type an address and Search (free OpenStreetMap/Nominatim geocoding), or
 *  2) one-tap "Use my GPS", or
 *  3) fine-tune lat/lng manually.
 * Emits (locationChange) whenever a usable coordinate is set.
 */
@Component({
  selector: 'app-location-picker',
  standalone: false,
  template: `
    <div class="loc">
      <div class="d-flex gap-2 mb-2">
        <input class="form-control" [(ngModel)]="address" name="locAddr"
               placeholder="Type your address / area, e.g. Connaught Place, Delhi"
               (keyup.enter)="search()">
        <button class="btn btn-outline-primary text-nowrap" type="button" (click)="search()" [disabled]="busy">Search</button>
        <button class="btn btn-outline-secondary text-nowrap" type="button" (click)="gps()" [disabled]="busy">📍 GPS</button>
      </div>
      <div class="d-flex gap-2 align-items-center">
        <!-- Auto-filled by search/GPS, but editable so users can fine-tune. -->
        <input type="number" step="any" class="form-control form-control-sm" style="max-width:120px"
               [(ngModel)]="lat" name="locLat" (ngModelChange)="emit()" placeholder="Lat" title="Latitude — set by search/GPS or edit manually">
        <input type="number" step="any" class="form-control form-control-sm" style="max-width:120px"
               [(ngModel)]="lng" name="locLng" (ngModelChange)="emit()" placeholder="Lng" title="Longitude — set by search/GPS or edit manually">
        <span class="small" [class.text-success]="ok" [class.text-danger]="err">{{ msg }}</span>
      </div>
    </div>
  `,
})
export class LocationPickerComponent {
  @Input() lat: number | null = null;
  @Input() lng: number | null = null;
  @Input() address = '';
  @Output() locationChange = new EventEmitter<PickedLocation>();

  busy = false;
  msg = '';
  ok = false;
  err = false;

  private set(lat: number, lng: number, label: string, address?: string) {
    this.lat = Math.round(lat * 1e6) / 1e6;
    this.lng = Math.round(lng * 1e6) / 1e6;
    this.ok = true; this.err = false; this.msg = label;
    this.emit(address);
  }

  emit(address?: string) {
    if (this.lat == null || this.lng == null) return;
    this.locationChange.emit({ lat: Number(this.lat), lng: Number(this.lng), address: address ?? this.address });
  }

  gps() {
    if (!navigator.geolocation) { this.fail('GPS unavailable — type an address or lat/lng'); return; }
    this.start('Locating…');
    navigator.geolocation.getCurrentPosition(
      (p) => { this.busy = false; this.set(p.coords.latitude, p.coords.longitude, 'Located via GPS ✓'); },
      () => this.fail('GPS denied — type an address instead'),
    );
  }

  async search() {
    const q = this.address.trim();
    if (!q) { this.fail('Type an address to search'); return; }
    this.start('Searching…');
    try {
      // Plain fetch (not HttpClient) so the auth token isn't attached to Nominatim.
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { Accept: 'application/json' } },
      );
      const data = await r.json();
      this.busy = false;
      if (!data?.length) { this.fail('No match — try a more specific address or use GPS'); return; }
      this.set(parseFloat(data[0].lat), parseFloat(data[0].lon), 'Found ✓', data[0].display_name);
    } catch {
      this.fail('Search failed — check your connection or enter lat/lng');
    }
  }

  private start(m: string) { this.busy = true; this.ok = false; this.err = false; this.msg = m; }
  private fail(m: string) { this.busy = false; this.ok = false; this.err = true; this.msg = m; }
}
