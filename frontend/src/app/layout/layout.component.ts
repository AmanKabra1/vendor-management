import { Component } from '@angular/core';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-layout',
  standalone: false,
  template: `
    <nav class="navbar navbar-dark bg-primary px-3 flex-wrap">
      <div class="d-flex w-100 align-items-center justify-content-between">
        <span class="navbar-brand fw-bold d-flex align-items-center gap-2 mb-0">
          <span class="brand-chip">📦</span> RideFleet
        </span>
        <button class="btn btn-sm btn-outline-light d-lg-none" type="button"
                (click)="menuOpen = !menuOpen" aria-label="Toggle menu">☰</button>
      </div>

      <!-- Collapses on phones (toggled by ☰); always inline on lg+ -->
      <div class="w-100 mt-2 mt-lg-0 d-lg-flex align-items-lg-center justify-content-lg-between"
           [class.d-none]="!menuOpen">
        <div class="navbar-nav flex-column flex-lg-row gap-lg-3" (click)="menuOpen = false">
          <ng-container *ngIf="auth.isVendor">
            <a class="nav-link" routerLink="/vendor" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">My Orders</a>
            <a class="nav-link" routerLink="/vendor/performance" routerLinkActive="active">My Performance</a>
          </ng-container>
          <ng-container *ngIf="auth.isPlatformAdmin">
            <a class="nav-link" routerLink="/super" routerLinkActive="active">Admin Console</a>
          </ng-container>
          <ng-container *ngIf="auth.isStoreOwner">
            <a class="nav-link" routerLink="/store" routerLinkActive="active">My Store & Orders</a>
          </ng-container>
          <ng-container *ngIf="auth.isRider">
            <a class="nav-link" routerLink="/rider" routerLinkActive="active">Rider Hub</a>
          </ng-container>
          <ng-container *ngIf="auth.isCustomer">
            <a class="nav-link" routerLink="/customer" routerLinkActive="active">Order Groceries</a>
          </ng-container>
          <ng-container *ngIf="auth.isSupplyParticipant">
            <a class="nav-link" routerLink="/supply" routerLinkActive="active">Supply Chain</a>
          </ng-container>
        </div>

        <div class="navbar-nav flex-column flex-lg-row align-items-lg-center gap-2 gap-lg-3 mt-2 mt-lg-0">
          <span class="text-white-50 small">
            {{ auth.currentUser?.name }}
            <span class="badge bg-light text-primary ms-1 text-uppercase">{{ auth.currentUser?.role }}</span>
          </span>
          <button class="btn btn-sm btn-outline-light" (click)="auth.logout()">Logout</button>
        </div>
      </div>
    </nav>

    <main class="container-fluid py-4 px-md-5">
      <router-outlet></router-outlet>
    </main>

    <!-- AI support assistant (all signed-in pages) -->
    <app-chat-widget></app-chat-widget>
  `,
  styles: [
    `.nav-link.active { color: #fff; font-weight: 600; }`,
    `.brand-chip { width: 32px; height: 32px; border-radius: 9px; background: rgba(255,255,255,.2); display: inline-flex; align-items: center; justify-content: center; font-size: 17px; }`,
  ],
})
export class LayoutComponent {
  menuOpen = false;
  constructor(public auth: AuthService) {}
}
