import { Component } from '@angular/core';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-layout',
  standalone: false,
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary px-3">
      <span class="navbar-brand fw-bold">📦 Vendor Management</span>

      <div class="navbar-nav me-auto flex-row gap-3">
        <ng-container *ngIf="auth.isAdmin">
          <a class="nav-link" routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
          <a class="nav-link" routerLink="/admin/vendors" routerLinkActive="active">Vendors</a>
          <a class="nav-link" routerLink="/admin/purchase-orders" routerLinkActive="active">Purchase Orders</a>
        </ng-container>
        <ng-container *ngIf="auth.isVendor">
          <a class="nav-link" routerLink="/vendor" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">My Orders</a>
          <a class="nav-link" routerLink="/vendor/performance" routerLinkActive="active">My Performance</a>
        </ng-container>
        <ng-container *ngIf="auth.isSuperAdmin">
          <a class="nav-link" routerLink="/super" routerLinkActive="active">Admin Console</a>
        </ng-container>
        <ng-container *ngIf="auth.isStoreOwner">
          <a class="nav-link" routerLink="/store" routerLinkActive="active">My Store & Orders</a>
        </ng-container>
        <ng-container *ngIf="auth.isRider">
          <a class="nav-link" routerLink="/rider" routerLinkActive="active">Rider Hub</a>
        </ng-container>
      </div>

      <div class="navbar-nav flex-row align-items-center gap-3">
        <span class="text-white-50 small">
          {{ auth.currentUser?.name }}
          <span class="badge bg-light text-primary ms-1 text-uppercase">{{ auth.currentUser?.role }}</span>
        </span>
        <button class="btn btn-sm btn-outline-light" (click)="auth.logout()">Logout</button>
      </div>
    </nav>

    <main class="container-fluid py-4 px-md-5">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `.nav-link.active { color: #fff; font-weight: 600; text-decoration: underline; }`,
  ],
})
export class LayoutComponent {
  constructor(public auth: AuthService) {}
}
