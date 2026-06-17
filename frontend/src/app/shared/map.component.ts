import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import * as L from 'leaflet';

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: string; // CSS color for the pin
}

@Component({
  selector: 'app-map',
  standalone: false,
  template: `<div #map class="vm-map" [style.height]="height"></div>`,
  styles: [
    `.vm-map { width: 100%; border-radius: 8px; z-index: 0; }`,
    `:host ::ng-deep .vm-pin {
       width: 18px; height: 18px; border-radius: 50% 50% 50% 0;
       transform: rotate(-45deg); border: 2px solid #fff;
       box-shadow: 0 1px 4px rgba(0,0,0,.4);
     }`,
  ],
})
export class MapComponent implements AfterViewInit, OnChanges {
  @ViewChild('map', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  @Input() markers: MapMarker[] = [];
  @Input() center: [number, number] = [28.61, 77.2]; // Delhi default
  @Input() zoom = 12;
  @Input() height = '320px';

  private map?: L.Map;
  private layer = L.layerGroup();

  ngAfterViewInit() {
    this.map = L.map(this.mapEl.nativeElement).setView(this.center, this.zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
    this.layer.addTo(this.map);
    this.render();
  }

  ngOnChanges() {
    if (this.map) this.render();
  }

  private render() {
    this.layer.clearLayers();
    const pts = this.markers.filter((m) => m.lat != null && m.lng != null);
    for (const m of pts) {
      const icon = L.divIcon({
        className: '',
        html: `<div class="vm-pin" style="background:${m.color || '#0d6efd'}"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 18],
      });
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(this.layer);
      if (m.label) marker.bindPopup(m.label);
    }
    if (pts.length === 1) {
      this.map!.setView([pts[0].lat, pts[0].lng], this.zoom);
    } else if (pts.length > 1) {
      this.map!.fitBounds(
        L.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number])).pad(0.2),
      );
    }
    // Leaflet needs a nudge when rendered inside a freshly shown container.
    setTimeout(() => this.map?.invalidateSize(), 0);
  }
}
