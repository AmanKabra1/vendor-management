import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';

@Component({
  selector: 'app-my-orders',
  standalone: false,
  template: `
    <h3 class="mb-4">My Purchase Orders</h3>

    <div class="card shadow-sm border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>PO #</th><th>Order Date</th><th>Delivery</th><th>Qty</th>
              <th>Status</th><th>Quality</th><th>Acknowledged</th><th class="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let po of orders">
              <td class="fw-semibold">{{ po.poNumber }}</td>
              <td>{{ po.orderDate | date: 'mediumDate' }}</td>
              <td>{{ po.deliveryDate ? (po.deliveryDate | date: 'mediumDate') : '—' }}</td>
              <td>{{ po.quantity }}</td>
              <td><span class="badge" [ngClass]="badge(po.status)">{{ po.status }}</span></td>
              <td>{{ po.qualityRating != null ? (po.qualityRating | number:'1.0-1') : '—' }}</td>
              <td>{{ po.acknowledgmentDate ? (po.acknowledgmentDate | date:'short') : '—' }}</td>
              <td class="text-end">
                <button
                  class="btn btn-sm btn-primary"
                  *ngIf="!po.acknowledgmentDate"
                  (click)="acknowledge(po)"
                >Acknowledge</button>
                <span *ngIf="po.acknowledgmentDate" class="text-success">✓ Acknowledged</span>
              </td>
            </tr>
            <tr *ngIf="!orders.length">
              <td colspan="8" class="text-center text-muted py-4">No purchase orders assigned yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class MyOrdersComponent implements OnInit {
  orders: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.get('purchase-orders').subscribe((o) => (this.orders = o));
  }

  badge(status: string) {
    return {
      'bg-success': status === 'completed',
      'bg-warning text-dark': status === 'pending' || status === 'issued',
      'bg-secondary': status === 'cancelled',
    };
  }

  acknowledge(po: any) {
    this.api
      .post(`purchase-orders/${po.id}/acknowledge`, {})
      .subscribe(() => this.load());
  }
}
