import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { AuthService } from '../shared/auth.service';
import { MapMarker } from '../shared/map.component';
import { PaymentService } from '../shared/payment.service';

@Component({
  selector: 'app-customer-dashboard',
  standalone: false,
  template: `
    <h3 class="mb-4">Order from a Kirana store</h3>

    <div class="row g-4">
      <!-- Left: location + nearby stores -->
      <div class="col-lg-5">
        <div class="card border-0 mb-3">
          <div class="card-header">My delivery location</div>
          <div class="card-body">
            <app-location-picker [lat]="lat" [lng]="lng" (locationChange)="onLoc($event)"></app-location-picker>
            <button class="btn btn-primary w-100 mt-2" (click)="findStores()">Find nearby kirana stores</button>
          </div>
        </div>

        <app-map [markers]="markers" [center]="[lat, lng]" height="240px"></app-map>

        <div class="list-group mt-3">
          <button class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  *ngFor="let s of stores" [class.active]="picked?.id===s.id" (click)="pick(s)">
            <span><span class="fw-semibold">{{ s.name }}</span> <small [class.text-white-50]="picked?.id===s.id" class="text-muted">· {{ s.category }}</small></span>
            <span class="badge bg-success">open</span>
          </button>
          <div class="list-group-item text-muted text-center" *ngIf="searched && !stores.length">No approved kirana stores nearby. Try a larger area or different coordinates.</div>
        </div>
      </div>

      <!-- Right: build the order -->
      <div class="col-lg-7">
        <div class="card border-0 mb-3">
          <div class="card-header">
            {{ picked ? 'Order from ' + picked.name : 'Select a store to start your order' }}
          </div>
          <div class="card-body" [class.opacity-50]="!picked">
            <label class="form-label">Your shopping list (one item per line)</label>
            <textarea class="form-control mb-2" rows="4" [(ngModel)]="listText" name="listText"
              placeholder="2x Aata 5kg&#10;1x Sugar 1kg&#10;Milk 2 packets"></textarea>

            <label class="form-label">Or upload a photo of your list (optional)</label>
            <input type="file" accept="image/*" class="form-control mb-2" (change)="onPhoto($event)">
            <div *ngIf="listImageUrl" class="mb-2"><img [src]="listImageUrl" style="max-height:90px;border-radius:8px"></div>

            <label class="form-label">Itemized (optional — helps the bill)</label>
            <div class="d-flex gap-2 mb-2" *ngFor="let it of items; let i = index">
              <input class="form-control" placeholder="Item" [(ngModel)]="it.name" [name]="'in'+i">
              <input type="number" class="form-control" style="max-width:90px" placeholder="Qty" [(ngModel)]="it.quantity" [name]="'iq'+i">
              <input type="number" class="form-control" style="max-width:110px" placeholder="Price" [(ngModel)]="it.price" [name]="'ip'+i">
              <button class="btn btn-outline-danger" (click)="items.splice(i,1)">✕</button>
            </div>
            <button class="btn btn-sm btn-outline-secondary mb-3" (click)="items.push({name:'',quantity:1,price:0})">+ Add item</button>

            <input class="form-control mb-2" placeholder="Contact phone" [(ngModel)]="phone" name="phone">
            <button class="btn btn-primary w-100" [disabled]="!picked || placing" (click)="placeOrder()">
              {{ placing ? 'Placing…' : 'Place order (COD)' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- My orders -->
    <h4 class="mt-4 mb-3">My orders</h4>
    <div class="card border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>Order #</th><th>Store</th><th>Items</th><th>Total</th><th>Status</th><th class="text-end">Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let o of orders">
              <td class="small fw-semibold">{{ o.orderNumber }}</td>
              <td>{{ o.store?.name }}</td>
              <td>{{ (o.items || []).length }} items</td>
              <td>₹{{ (o.totalAmount || 0) + (o.deliveryFee || 0) }}</td>
              <td><span class="badge bg-secondary">{{ o.status }}</span></td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-success me-1" *ngIf="o.paymentStatus !== 'COLLECTED' && o.status !== 'CANCELLED'" (click)="pay(o)">Pay online</button>
                <span class="badge bg-success me-1" *ngIf="o.paymentStatus === 'COLLECTED'">Paid</span>
                <a class="btn btn-sm btn-outline-info me-1" [href]="'/track/' + o.id" target="_blank">Track</a>
                <button class="btn btn-sm btn-outline-secondary" (click)="openInvoice(o)">Invoice</button>
              </td>
            </tr>
            <tr *ngIf="!orders.length"><td colspan="6" class="text-center text-muted py-3">No orders yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invoice modal -->
    <div class="modal-back" *ngIf="invoice" (click)="invoice=null">
      <div class="card shadow" style="max-width:460px;width:100%" (click)="$event.stopPropagation()" id="invoiceBox">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div><h5 class="mb-0">🧾 Invoice</h5><small class="text-muted">{{ invoice.orderNumber }}</small></div>
            <div class="text-end small text-muted">{{ invoice.date | date:'medium' }}</div>
          </div>
          <hr>
          <div class="small mb-2"><b>{{ invoice.store }}</b> → {{ invoice.customer?.name }} ({{ invoice.customer?.address }})</div>
          <table class="table table-sm">
            <thead><tr><th>Item</th><th class="text-center">Qty</th><th class="text-end">Price</th></tr></thead>
            <tbody>
              <tr *ngFor="let it of invoice.items"><td>{{ it.name }}</td><td class="text-center">{{ it.quantity }}</td><td class="text-end">₹{{ it.price }}</td></tr>
              <tr *ngIf="!invoice.items?.length"><td colspan="3" class="text-muted">See attached list</td></tr>
            </tbody>
          </table>
          <div class="d-flex justify-content-between"><span>Items subtotal</span><span>₹{{ invoice.itemsSubtotal }}</span></div>
          <div class="d-flex justify-content-between"><span>Delivery / rider fee <small class="text-muted">({{ invoice.distanceKm }} km)</small></span><span>₹{{ invoice.deliveryFee }}</span></div>
          <hr class="my-2">
          <div class="d-flex justify-content-between fw-bold fs-5"><span>Total</span><span>₹{{ invoice.total }}</span></div>
          <div class="small text-muted mt-1">{{ invoice.paymentMethod }} · {{ invoice.paymentStatus }}</div>
        </div>
        <div class="card-footer bg-white text-end">
          <button class="btn btn-light me-2" (click)="invoice=null">Close</button>
          <button class="btn btn-primary" (click)="print()">Print</button>
        </div>
      </div>
    </div>
  `,
  styles: [`.modal-back{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:1080;padding:1rem}`],
})
export class CustomerDashboardComponent implements OnInit {
  addr = '';
  lat = 28.61;
  lng = 77.2;
  gpsMsg = '';
  searched = false;
  stores: any[] = [];
  picked: any = null;
  markers: MapMarker[] = [];

  listText = '';
  listImageUrl = '';
  items: any[] = [];
  phone = '';
  placing = false;

  orders: any[] = [];
  invoice: any = null;

  constructor(private api: ApiService, private auth: AuthService, private payments: PaymentService) {}

  pay(o: any) {
    this.payments.pay(o.id, () => this.loadOrders());
  }

  ngOnInit() {
    this.phone = this.auth.currentUser?.phone || '';
    this.loadOrders();
  }

  loadOrders() {
    this.api.get('orders').subscribe((o) => (this.orders = o));
  }

  onLoc(e: { lat: number; lng: number; address?: string }) {
    this.lat = e.lat;
    this.lng = e.lng;
    if (e.address) this.addr = e.address;
  }

  findStores() {
    this.searched = true;
    this.api.get(`stores/nearby?lat=${this.lat}&lng=${this.lng}&radius=20000`).subscribe((s) => {
      this.stores = s;
      this.markers = [
        { lat: this.lat, lng: this.lng, label: 'You', color: '#dc3545' },
        ...s.filter((x: any) => x.location?.coordinates?.length === 2).map((x: any) => ({
          lat: x.location.coordinates[1], lng: x.location.coordinates[0], label: x.name, color: '#0d6efd',
        })),
      ];
    });
  }

  pick(s: any) { this.picked = s; }

  onPhoto(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => (this.listImageUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  placeOrder() {
    if (!this.picked) return;
    this.placing = true;
    const cleanItems = this.items.filter((i) => i.name?.trim());
    const body = {
      store: this.picked.id,
      customer: { name: this.auth.currentUser?.name, phone: this.phone, address: this.addr, lat: this.lat, lng: this.lng },
      items: cleanItems,
      listText: this.listText,
      listImageUrl: this.listImageUrl,
      paymentMethod: 'COD',
    };
    this.api.post('orders', body).subscribe({
      next: () => {
        this.placing = false;
        this.listText = ''; this.listImageUrl = ''; this.items = [];
        this.loadOrders();
        alert('Order placed! The store will confirm and assign a rider.');
      },
      error: (err) => { this.placing = false; alert(err?.error?.message || 'Could not place order'); },
    });
  }

  openInvoice(o: any) {
    this.api.get(`orders/${o.id}/invoice`).subscribe((inv) => (this.invoice = inv));
  }

  print() {
    window.print();
  }
}
