import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-supply-dashboard',
  standalone: false,
  template: `
    <h3 class="mb-1">Supply Chain</h3>
    <p class="text-muted mb-4">
      {{ auth.isSupplier ? 'List your products and fulfil incoming restock orders.' : 'Restock your shop from wholesalers & distributors.' }}
    </p>

    <!-- ============ SUPPLIER: my catalog ============ -->
    <div *ngIf="auth.isSupplier" class="row g-4 mb-4">
      <div class="col-lg-5">
        <div class="card border-0">
          <div class="card-header">Add a product</div>
          <div class="card-body">
            <input class="form-control mb-2" placeholder="Product name" [(ngModel)]="pf.name" name="pn">
            <div class="d-flex gap-2 mb-2">
              <input class="form-control" placeholder="Category" [(ngModel)]="pf.category" name="pc">
              <input class="form-control" placeholder="Unit (bag, case…)" [(ngModel)]="pf.unit" name="pu">
            </div>
            <div class="d-flex gap-2 mb-2">
              <input type="number" class="form-control" placeholder="Price ₹" [(ngModel)]="pf.price" name="pp">
              <input type="number" class="form-control" placeholder="Stock" [(ngModel)]="pf.stock" name="ps">
            </div>
            <button class="btn btn-primary w-100" (click)="addProduct()">Add to catalog</button>
          </div>
        </div>
      </div>
      <div class="col-lg-7">
        <div class="card border-0">
          <div class="card-header">My catalog</div>
          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead class="table-light"><tr><th>Product</th><th>Unit</th><th>Price</th><th>Stock</th><th></th></tr></thead>
              <tbody>
                <tr *ngFor="let p of catalog">
                  <td class="fw-semibold">{{ p.name }}<div class="small text-muted">{{ p.category }}</div></td>
                  <td>{{ p.unit }}</td>
                  <td><input type="number" class="form-control form-control-sm" style="width:90px" [(ngModel)]="p.price" [name]="'pr'+p.id"></td>
                  <td><input type="number" class="form-control form-control-sm" style="width:80px" [(ngModel)]="p.stock" [name]="'st'+p.id"></td>
                  <td class="text-nowrap">
                    <button class="btn btn-sm btn-outline-primary me-1" (click)="saveProduct(p)">Save</button>
                    <button class="btn btn-sm btn-outline-danger" (click)="delProduct(p)">✕</button>
                  </td>
                </tr>
                <tr *ngIf="!catalog.length"><td colspan="5" class="text-center text-muted py-3">No products yet.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ BUYER: browse & order ============ -->
    <div *ngIf="auth.isSupplyParticipant" class="row g-4 mb-4">
      <div class="col-lg-4">
        <div class="card border-0">
          <div class="card-header">Suppliers</div>
          <div class="list-group list-group-flush">
            <button class="list-group-item list-group-item-action d-flex justify-content-between"
                    *ngFor="let s of suppliers" [class.active]="seller?._id===s._id" (click)="pickSeller(s)">
              <span class="fw-semibold">{{ s.name }}</span>
              <span class="badge bg-secondary text-uppercase">{{ s.role }}</span>
            </button>
            <div class="list-group-item text-muted text-center" *ngIf="!suppliers.length">No suppliers yet.</div>
          </div>
        </div>
      </div>
      <div class="col-lg-8">
        <div class="card border-0">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>{{ seller ? seller.name + "'s catalog" : 'Select a supplier' }}</span>
            <span *ngIf="cart.length" class="badge bg-primary">Cart: {{ cart.length }} · ₹{{ cartTotal }}</span>
          </div>
          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead class="table-light"><tr><th>Product</th><th>Unit</th><th>Price</th><th>Qty</th><th></th></tr></thead>
              <tbody>
                <tr *ngFor="let p of sellerCatalog">
                  <td class="fw-semibold">{{ p.name }}</td><td>{{ p.unit }}</td><td>₹{{ p.price }}</td>
                  <td><input type="number" min="1" class="form-control form-control-sm" style="width:80px" [(ngModel)]="p.qty" [name]="'q'+p.id"></td>
                  <td><button class="btn btn-sm btn-outline-primary" (click)="addToCart(p)">Add</button></td>
                </tr>
                <tr *ngIf="seller && !sellerCatalog.length"><td colspan="5" class="text-center text-muted py-3">No products in this catalog.</td></tr>
                <tr *ngIf="!seller"><td colspan="5" class="text-center text-muted py-3">Pick a supplier to see their products.</td></tr>
              </tbody>
            </table>
          </div>
          <div class="card-footer bg-white d-flex justify-content-between align-items-center" *ngIf="cart.length">
            <span class="small text-muted">{{ cart.length }} item(s) · total ₹{{ cartTotal }}</span>
            <button class="btn btn-primary" (click)="placeOrder()" [disabled]="placing">Place restock order</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ ORDERS (both sides) ============ -->
    <div class="card border-0">
      <div class="card-header">Supply orders</div>
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light"><tr><th>Ref</th><th>Buyer</th><th>Supplier</th><th>Items</th><th>Total</th><th>Status</th><th class="text-end">Action</th></tr></thead>
          <tbody>
            <tr *ngFor="let o of orders">
              <td class="small fw-semibold">{{ o.refNumber }}</td>
              <td>{{ o.buyer?.name }}</td><td>{{ o.seller?.name }}</td>
              <td>{{ o.items?.length }}</td><td>₹{{ o.totalAmount }}</td>
              <td><span class="badge" [ngClass]="badge(o.status)">{{ o.status }}</span></td>
              <td class="text-end text-nowrap">
                <!-- seller advances -->
                <button class="btn btn-sm btn-success me-1" *ngIf="isSeller(o) && (o.status==='PLACED'||o.status==='ACCEPTED')" (click)="advance(o)">
                  {{ o.status==='PLACED' ? 'Accept' : 'Dispatch' }}
                </button>
                <!-- buyer receives -->
                <button class="btn btn-sm btn-primary me-1" *ngIf="isBuyer(o) && o.status==='DISPATCHED'" (click)="receive(o)">Received</button>
                <!-- cancel before dispatch -->
                <button class="btn btn-sm btn-outline-danger" *ngIf="o.status==='PLACED'||o.status==='ACCEPTED'" (click)="cancel(o)">Cancel</button>
              </td>
            </tr>
            <tr *ngIf="!orders.length"><td colspan="7" class="text-center text-muted py-3">No supply orders yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class SupplyDashboardComponent implements OnInit {
  catalog: any[] = [];
  pf: any = this.blankProduct();
  suppliers: any[] = [];
  seller: any = null;
  sellerCatalog: any[] = [];
  cart: any[] = [];
  placing = false;
  orders: any[] = [];

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit() {
    if (this.auth.isSupplier) this.loadCatalog();
    this.api.get('products/suppliers').subscribe((s) => (this.suppliers = s));
    this.loadOrders();
  }

  blankProduct() { return { name: '', category: 'GENERAL', unit: 'unit', price: 0, stock: 0 }; }
  loadCatalog() { this.api.get('products/mine').subscribe((c) => (this.catalog = c)); }
  loadOrders() { this.api.get('supply-orders').subscribe((o) => (this.orders = o)); }

  addProduct() {
    if (!this.pf.name.trim()) return;
    this.api.post('products', this.pf).subscribe(() => { this.pf = this.blankProduct(); this.loadCatalog(); });
  }
  saveProduct(p: any) {
    this.api.patch(`products/${p.id}`, { price: Number(p.price), stock: Number(p.stock) }).subscribe();
  }
  delProduct(p: any) {
    if (!confirm(`Remove ${p.name}?`)) return;
    this.api.delete(`products/${p.id}`).subscribe(() => this.loadCatalog());
  }

  pickSeller(s: any) {
    this.seller = s; this.cart = [];
    this.api.get(`products/by-seller/${s._id}`).subscribe((c) => (this.sellerCatalog = c));
  }
  addToCart(p: any) {
    const qty = Number(p.qty) || 1;
    this.cart.push({ product: p.id, name: p.name, unit: p.unit, price: p.price, quantity: qty });
  }
  get cartTotal() { return this.cart.reduce((s, i) => s + i.price * i.quantity, 0); }

  placeOrder() {
    if (!this.seller || !this.cart.length) return;
    this.placing = true;
    this.api.post('supply-orders', { seller: this.seller._id, items: this.cart }).subscribe({
      next: () => { this.placing = false; this.cart = []; this.loadOrders(); alert('Restock order placed!'); },
      error: (e) => { this.placing = false; alert(e?.error?.message || 'Could not place order'); },
    });
  }

  isSeller(o: any) { return o.seller?._id === this.auth.currentUser?.id || o.seller === this.auth.currentUser?.id; }
  isBuyer(o: any) { return o.buyer?._id === this.auth.currentUser?.id || o.buyer === this.auth.currentUser?.id; }

  advance(o: any) { this.api.patch(`supply-orders/${o.id}/advance`).subscribe(() => this.loadOrders()); }
  receive(o: any) { this.api.patch(`supply-orders/${o.id}/receive`).subscribe(() => this.loadOrders()); }
  cancel(o: any) { this.api.patch(`supply-orders/${o.id}/cancel`).subscribe(() => this.loadOrders()); }

  badge(s: string) {
    return {
      'bg-success': s === 'RECEIVED',
      'bg-info text-dark': s === 'DISPATCHED',
      'bg-warning text-dark': s === 'PLACED' || s === 'ACCEPTED',
      'bg-secondary': s === 'CANCELLED',
    };
  }
}
