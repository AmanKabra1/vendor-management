import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * A slim top bar for the public pages that live OUTSIDE the app layout
 * (the shop directory and the emergency screen). Those pages deliberately have
 * no navbar so they load with no login wall — but that left a visitor with no
 * way back once they arrived. This gives them three escape routes that always
 * work, whatever they came from:
 *
 *  - Back    → browser history (the common case: they came from a dashboard),
 *              falling back to Home when the page was opened cold from a link.
 *  - Home    → the public landing page.
 *  - Dashboard (only when signed in) → straight to their own area, since a
 *              logged-in user on a nav-less page is otherwise stranded.
 */
@Component({
  selector: 'app-public-header',
  standalone: false,
  template: `
    <div class="rf-pub-head">
      <button type="button" class="rf-pub-btn" (click)="back()">
        ← {{ 'common.back' | t }}
      </button>
      <span class="rf-pub-title" *ngIf="title">{{ title }}</span>
      <span class="rf-pub-spacer"></span>
      <a class="rf-pub-btn" routerLink="/">🏠 {{ 'common.home' | t }}</a>
      <a class="rf-pub-btn primary" *ngIf="auth.isLoggedIn" [routerLink]="auth.home">
        {{ 'common.dashboard' | t }}
      </a>
    </div>
  `,
  styles: [
    `
      .rf-pub-head {
        position: sticky;
        top: 0;
        z-index: 1020;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 0.75rem;
        margin-bottom: 1rem;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid var(--rf-line);
      }
      .rf-pub-spacer { flex: 1 1 auto; }
      .rf-pub-title {
        font-weight: 700;
        font-size: 0.95rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .rf-pub-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        min-height: 40px;
        padding: 0.35rem 0.8rem;
        border-radius: 999px;
        border: 1.5px solid var(--rf-line);
        background: #fff;
        color: var(--rf-ink);
        font-weight: 700;
        font-size: 0.85rem;
        text-decoration: none;
        cursor: pointer;
        white-space: nowrap;
      }
      .rf-pub-btn:hover { border-color: var(--rf-violet); color: var(--rf-indigo); }
      .rf-pub-btn.primary {
        background: var(--rf-indigo);
        border-color: var(--rf-indigo);
        color: #fff;
      }
      /* Data-saver / print: the bar is chrome, not content. */
      @media print { .rf-pub-head { display: none; } }
    `,
  ],
})
export class PublicHeaderComponent {
  /** Optional page name shown between Back and the right-hand links. */
  @Input() title = '';

  constructor(
    private location: Location,
    private router: Router,
    public auth: AuthService,
  ) {}

  /**
   * Prefer real history so "Back" returns exactly where they were. When there
   * is none — the page was opened directly (shared link, new tab, QR code) —
   * send a signed-in user to their dashboard and everyone else to the landing
   * page, so Back is never a dead button.
   */
  back() {
    const hasHistory = window.history.length > 1;
    if (hasHistory) {
      this.location.back();
    } else {
      this.router.navigateByUrl(this.auth.isLoggedIn ? this.auth.home : '/');
    }
  }
}
