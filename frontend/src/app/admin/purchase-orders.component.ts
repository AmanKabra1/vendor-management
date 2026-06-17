import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';

@Component({
  selector: 'app-admin-pos',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="mb-0">Purchase Orders</h3>
      <button class="btn btn-primary" (click)="openCreate()">+ New PO</button>
    </div>

    <div class="d-flex gap-2 mb-3">
      <select class="form-select" style="max-width:260px" [(ngModel)]="vendorFilter" (change)="load()">
        <option [ngValue]="''">All vendors</option>
        <option *ngFor="let v of vendors" [ngValue]="v.id">{{ v.name }} ({{ v.vendorCode }})</option>
      </select>
    </div>

    <div class="card shadow-sm border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>PO #</th><th>Vendor</th><th>Order Date</th><th>Delivery</th>
              <th>Qty</th><th>Status</th><th>Quality</th><th>Ack?</th><th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let po of orders">
              <td class="fw-semibold">{{ po.poNumber }}</td>
              <td>{{ po.vendor?.name }}</td>
              <td>{{ po.orderDate | date: 'mediumDate' }}</td>
              <td>{{ po.deliveryDate ? (po.deliveryDate | date: 'mediumDate') : '—' }}</td>
              <td>{{ po.quantity }}</td>
              <td><span class="badge" [ngClass]="badge(po.status)">{{ po.status }}</span></td>
              <td>{{ po.qualityRating != null ? (po.qualityRating | number:'1.0-1') : '—' }}</td>
              <td>{{ po.acknowledgmentDate ? '✓' : '—' }}</td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-outline-success me-1" *ngIf="po.status !== 'completed'" (click)="complete(po)">Mark Completed</button>
                <button class="btn btn-sm btn-outline-primary me-1" (click)="openRate(po)">Rate</button>
                <button class="btn btn-sm btn-outline-danger" (click)="remove(po)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="!orders.length">
              <td colspan="9" class="text-center text-muted py-4">No purchase orders.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create PO modal -->
    <div class="modal-backdrop-custom" *ngIf="showForm" (click)="close()">
      <div class="card shadow editor-card" (click)="$event.stopPropagation()">
        <div class="card-header bg-white fw-semibold">New Purchase Order</div>
        <div class="card-body">
          <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>
          <div class="mb-2">
            <label class="form-label">Vendor</label>
            <select class="form-select" name="vendor" [(ngModel)]="form.vendor">
              <option [ngValue]="null" disabled>Select vendor…</option>
              <option *ngFor="let v of vendors" [ngValue]="v.id">{{ v.name }} ({{ v.vendorCode }})</option>
            </select>
          </div>
          <div class="mb-2">
            <label class="form-label">PO Number</label>
            <input class="form-control" name="poNumber" [(ngModel)]="form.poNumber" />
          </div>
          <div class="row">
            <div class="col mb-2">
              <label class="form-label">Order Date</label>
              <input type="date" class="form-control" name="orderDate" [(ngModel)]="form.orderDate" />
            </div>
            <div class="col mb-2">
              <label class="form-label">Issue Date</label>
              <input type="date" class="form-control" name="issueDate" [(ngModel)]="form.issueDate" />
            </div>
          </div>
          <div class="mb-2">
            <label class="form-label">Delivery Date <span class="text-muted">(optional)</span></label>
            <input type="date" class="form-control" name="deliveryDate" [(ngModel)]="form.deliveryDate" />
          </div>
          <div class="row">
            <div class="col mb-2">
              <label class="form-label">Quantity</label>
              <input type="number" class="form-control" name="quantity" [(ngModel)]="form.quantity" />
            </div>
            <div class="col mb-2">
              <label class="form-label">Status</label>
              <select class="form-select" name="status" [(ngModel)]="form.status">
                <option value="pending">pending</option>
                <option value="issued">issued</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          </div>
          <div class="mb-2">
            <label class="form-label">Items (comma separated)</label>
            <input class="form-control" name="items" [(ngModel)]="itemsRaw" placeholder="widget, bolt, gear" />
          </div>
        </div>
        <div class="card-footer bg-white text-end">
          <button class="btn btn-light me-2" (click)="close()">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving">Create</button>
        </div>
      </div>
    </div>

    <!-- Rate modal -->
    <div class="modal-backdrop-custom" *ngIf="rating" (click)="rating=null">
      <div class="card shadow editor-card" (click)="$event.stopPropagation()" style="max-width:380px">
        <div class="card-header bg-white fw-semibold">Rate PO {{ rating.poNumber }}</div>
        <div class="card-body">
          <label class="form-label">Quality Rating (0–5)</label>
          <input type="number" min="0" max="5" step="0.5" class="form-control" [(ngModel)]="ratingValue" />
        </div>
        <div class="card-footer bg-white text-end">
          <button class="btn btn-light me-2" (click)="rating=null">Cancel</button>
          <button class="btn btn-primary" (click)="saveRating()">Save</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `.modal-backdrop-custom { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 1050; }`,
    `.editor-card { width: 100%; max-width: 520px; }`,
  ],
})
export class AdminPurchaseOrdersComponent implements OnInit {
  orders: any[] = [];
  vendors: any[] = [];
  vendorFilter: number | '' = '';
  showForm = false;
  saving = false;
  error = '';
  itemsRaw = '';
  form: any = this.blankForm();

  rating: any = null;
  ratingValue = 0;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get('vendors').subscribe((v) => (this.vendors = v));
    this.load();
  }

  blankForm() {
    return {
      vendor: null,
      poNumber: '',
      orderDate: '',
      issueDate: '',
      deliveryDate: '',
      quantity: 1,
      status: 'pending',
    };
  }

  load() {
    const q = this.vendorFilter ? `?vendorId=${this.vendorFilter}` : '';
    this.api.get(`purchase-orders${q}`).subscribe((o) => (this.orders = o));
  }

  badge(status: string) {
    return {
      'bg-success': status === 'completed',
      'bg-warning text-dark': status === 'pending' || status === 'issued',
      'bg-secondary': status === 'cancelled',
    };
  }

  openCreate() {
    this.error = '';
    this.itemsRaw = '';
    this.form = this.blankForm();
    this.showForm = true;
  }

  close() {
    this.showForm = false;
  }

  save() {
    this.saving = true;
    this.error = '';
    const payload: any = {
      ...this.form,
      quantity: Number(this.form.quantity),
      orderDate: new Date(this.form.orderDate).toISOString(),
      issueDate: new Date(this.form.issueDate).toISOString(),
      items: this.itemsRaw
        ? { list: this.itemsRaw.split(',').map((s) => s.trim()) }
        : { list: [] },
    };
    if (this.form.deliveryDate) {
      payload.deliveryDate = new Date(this.form.deliveryDate).toISOString();
    } else {
      delete payload.deliveryDate;
    }
    this.api.post('purchase-orders', payload).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.error =
          (Array.isArray(err?.error?.message)
            ? err.error.message.join(', ')
            : err?.error?.message) || 'Create failed';
      },
    });
  }

  complete(po: any) {
    this.api
      .put(`purchase-orders/${po.id}`, {
        status: 'completed',
        deliveryDate: po.deliveryDate || new Date().toISOString(),
      })
      .subscribe(() => this.load());
  }

  openRate(po: any) {
    this.rating = po;
    this.ratingValue = po.qualityRating ?? 0;
  }

  saveRating() {
    this.api
      .put(`purchase-orders/${this.rating.id}`, {
        qualityRating: Number(this.ratingValue),
      })
      .subscribe(() => {
        this.rating = null;
        this.load();
      });
  }

  remove(po: any) {
    if (!confirm(`Delete PO "${po.poNumber}"?`)) return;
    this.api.delete(`purchase-orders/${po.id}`).subscribe(() => this.load());
  }
}
