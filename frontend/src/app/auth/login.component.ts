import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  template: `
    <div class="auth-wrap">
      <div class="card login-card">
        <div class="row g-0">
          <!-- Brand panel -->
          <div class="col-md-6 brand-pane d-none d-md-flex">
            <div>
              <div class="logo-chip">📦</div>
              <h2 class="text-white fw-bold mb-2">RideFleet</h2>
              <p class="text-white-50 mb-4">Shared delivery riders for every store. Hire nearby, track live, deliver fast.</p>
              <ul class="feat list-unstyled">
                <li>🛵 Hire available riders in your area</li>
                <li>🗺️ Live map tracking with OTP delivery</li>
                <li>⚡ Real-time status for store & customer</li>
              </ul>
            </div>
          </div>
          <!-- Form panel -->
          <div class="col-md-6">
            <div class="p-4 p-lg-5">
              <h3 class="mb-1">Welcome back</h3>
              <p class="text-muted mb-4">Sign in to your account</p>

              <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>

              <form (ngSubmit)="submit()">
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input class="form-control" type="email" name="email" [(ngModel)]="email" placeholder="admin@vendor.com" required />
                </div>
                <div class="mb-3">
                  <label class="form-label">Password</label>
                  <div class="input-group">
                    <input class="form-control" [type]="showPw ? 'text' : 'password'" name="password" [(ngModel)]="password" placeholder="••••••" required />
                    <button class="btn btn-outline-secondary" type="button" (click)="showPw = !showPw" [attr.aria-label]="showPw ? 'Hide password' : 'Show password'">
                      {{ showPw ? '🙈' : '👁️' }}
                    </button>
                  </div>
                </div>
                <button class="btn btn-primary w-100 py-2" [disabled]="loading">
                  {{ loading ? 'Signing in…' : 'Sign In' }}
                </button>
              </form>

              <p class="text-center mt-3 mb-0">New here? <a routerLink="/register">Create an account</a></p>
              <p class="text-center text-muted small mt-2 mb-0">Demo admin: admin&#64;vendor.com / admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `.login-card { width: 100%; max-width: 860px; border: none; border-radius: 22px; box-shadow: 0 24px 70px rgba(20,10,50,.35); position: relative; z-index: 1; animation: rf-rise .4s ease both; }`,
    `.brand-pane { background: linear-gradient(150deg, #4c1d95, #4f46e5 60%, #2563eb); padding: 2.5rem; align-items: center; }`,
    `.logo-chip { width: 52px; height: 52px; border-radius: 14px; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 1rem; }`,
    `.feat li { color: #e9d5ff; padding: 7px 0; border-top: 1px solid rgba(255,255,255,.12); font-size: .92rem; }`,
  ],
})
export class LoginComponent {
  email = '';
  password = '';
  showPw = false;
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigateByUrl(this.auth.home);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Login failed';
        this.loading = false;
      },
    });
  }
}
