import { Component } from '@angular/core';
import { AuthService, ROLE_META } from '../shared/auth.service';
import { I18nService } from '../shared/i18n.service';

@Component({
  selector: 'app-layout',
  standalone: false,
  template: `
    <nav class="navbar navbar-dark bg-primary px-3 flex-wrap">
      <div class="d-flex w-100 align-items-center justify-content-between gap-2">
        <a class="navbar-brand fw-bold d-flex align-items-center gap-2 mb-0" [routerLink]="auth.home">
          <span class="brand-chip">🏪</span>
          <span>
            {{ 'app.name' | t }}
            <small class="d-block text-white-50 fw-normal" style="font-size:.66rem;line-height:1">
              {{ 'app.tagline' | t }}
            </small>
          </span>
        </a>

        <div class="d-flex align-items-center gap-2">
          <!-- Language toggle stays visible at every width: it is the single
               most important control for a first-time small-town user. -->
          <button class="rf-lang-btn" (click)="i18n.toggleLang()"
                  [attr.aria-label]="'Switch language'">
            {{ i18n.lang() === 'en' ? 'हिं' : 'EN' }}
          </button>
          <a class="btn btn-sm btn-danger d-lg-none" routerLink="/emergency" aria-label="Emergency">🆘</a>
          <button class="btn btn-sm btn-outline-light d-lg-none" type="button"
                  (click)="menuOpen = !menuOpen" aria-label="Toggle menu">☰</button>
        </div>
      </div>

      <!-- Collapses on phones (toggled by ☰); always inline on lg+ -->
      <div class="w-100 mt-2 mt-lg-0 d-lg-flex align-items-lg-center justify-content-lg-between"
           [class.d-none]="!menuOpen">
        <div class="navbar-nav flex-column flex-lg-row gap-lg-2" (click)="menuOpen = false">
          <ng-container *ngIf="auth.isVendor">
            <a class="nav-link" routerLink="/vendor" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">My Orders</a>
            <a class="nav-link" routerLink="/vendor/performance" routerLinkActive="active">My Performance</a>
          </ng-container>
          <ng-container *ngIf="auth.isPlatformAdmin">
            <a class="nav-link" routerLink="/super" routerLinkActive="active">{{ 'nav.admin' | t }}</a>
          </ng-container>
          <ng-container *ngIf="auth.isStoreSide">
            <a class="nav-link" routerLink="/store" routerLinkActive="active">{{ 'nav.myStore' | t }}</a>
          </ng-container>
          <ng-container *ngIf="auth.isRider">
            <a class="nav-link" routerLink="/rider" routerLinkActive="active">{{ 'nav.riderHub' | t }}</a>
          </ng-container>
          <ng-container *ngIf="auth.isCustomer">
            <a class="nav-link" routerLink="/customer" routerLinkActive="active">{{ 'nav.order' | t }}</a>
          </ng-container>
          <ng-container *ngIf="auth.isSalesAgent">
            <a class="nav-link" routerLink="/sales" routerLinkActive="active">{{ 'nav.sales' | t }}</a>
          </ng-container>
          <ng-container *ngIf="auth.isSupplyParticipant">
            <a class="nav-link" routerLink="/supply" routerLinkActive="active">{{ 'nav.supply' | t }}</a>
          </ng-container>
          <a class="nav-link" routerLink="/shops" routerLinkActive="active">{{ 'nav.shops' | t }}</a>
          <a class="nav-link d-none d-lg-inline-flex" routerLink="/emergency" routerLinkActive="active">
            🆘 {{ 'nav.emergency' | t }}
          </a>
        </div>

        <div class="navbar-nav flex-column flex-lg-row align-items-lg-center gap-2 gap-lg-3 mt-2 mt-lg-0">
          <!-- Data saver + bigger text: real settings for real phones. -->
          <div class="d-flex align-items-center gap-2">
            <button class="rf-lang-btn" (click)="i18n.toggleLite()"
                    [title]="'prefs.lite' | t">
              {{ i18n.lite() ? '🐢' : '🛰️' }} {{ 'prefs.lite' | t }}
            </button>
            <button class="rf-lang-btn" (click)="i18n.toggleBigText()" [title]="'prefs.bigText' | t">
              {{ i18n.bigText() ? 'A-' : 'A+' }}
            </button>
          </div>
          <span class="text-white-50 small">
            {{ auth.currentUser?.name }}
            <span class="badge bg-light text-primary ms-1">{{ roleLabel }}</span>
          </span>
          <button class="btn btn-sm btn-outline-light" (click)="auth.logout()">{{ 'nav.logout' | t }}</button>
        </div>
      </div>
    </nav>

    <div class="alert alert-warning mb-0 rounded-0 py-2 small text-center rf-lite-note">
      {{ 'prefs.liteOn' | t }}
    </div>

    <!-- Approval banner: tells a pending shop/rider exactly where they stand
         instead of leaving them wondering why nothing works. Only approval-gated
         roles ever see it — never a customer, staff member or admin. -->
    <div class="alert alert-info mb-0 rounded-0 py-2 small text-center"
         *ngIf="auth.isPendingApproval">
      ⏳ {{ 'store.awaitingApproval' | t }}
    </div>

    <main class="container-fluid py-4 px-3 px-md-5">
      <router-outlet></router-outlet>
    </main>

    <!-- Phone-only bottom bar: the four taps people make all day. -->
    <nav class="rf-bottom-nav">
      <a [routerLink]="auth.home" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
        <span class="bn-ic">🏠</span>{{ 'nav.home' | t }}
      </a>
      <a routerLink="/shops" routerLinkActive="active">
        <span class="bn-ic">🏪</span>{{ 'nav.shops' | t }}
      </a>
      <!-- The shop side gets a direct jump to the khata; for everyone else Home
           already *is* their order screen, so a second link would be dead weight. -->
      <a *ngIf="auth.isStoreSide" routerLink="/store" routerLinkActive="active">
        <span class="bn-ic">📒</span>{{ 'nav.khata' | t }}
      </a>
      <a routerLink="/emergency" routerLinkActive="active" class="sos">
        <span class="bn-ic">🆘</span>{{ 'nav.emergency' | t }}
      </a>
    </nav>

    <!-- AI support assistant (all signed-in pages) -->
    <app-chat-widget></app-chat-widget>
  `,
  styles: [
    `.nav-link.active { color: #fff; font-weight: 700; }`,
    `.brand-chip { width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,.2); display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }`,
  ],
})
export class LayoutComponent {
  menuOpen = false;

  constructor(public auth: AuthService, public i18n: I18nService) {}

  /** The user's role in their own language. */
  get roleLabel(): string {
    const role = this.auth.currentUser?.role;
    if (!role) return '';
    const meta = ROLE_META[role];
    return meta ? this.i18n.pick(meta.en, meta.hi) : role;
  }
}
