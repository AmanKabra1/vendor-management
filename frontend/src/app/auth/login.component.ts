import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  template: `
    <div class="auth-wrap">
      <div class="card shadow-sm auth-card">
        <div class="card-body p-4">
          <h3 class="mb-1 fw-bold text-primary">Vendor Management</h3>
          <p class="text-muted mb-4">Sign in to your account</p>

          <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>

          <form (ngSubmit)="submit()">
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input
                class="form-control"
                type="email"
                name="email"
                [(ngModel)]="email"
                placeholder="admin@vendor.com"
                required
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Password</label>
              <input
                class="form-control"
                type="password"
                name="password"
                [(ngModel)]="password"
                placeholder="••••••"
                required
              />
            </div>
            <button class="btn btn-primary w-100" [disabled]="loading">
              {{ loading ? 'Signing in…' : 'Sign In' }}
            </button>
          </form>

          <p class="text-center mt-3 mb-0">
            New vendor? <a routerLink="/register">Create an account</a>
          </p>
          <p class="text-center text-muted small mt-2 mb-0">
            Demo admin: admin&#64;vendor.com / admin123
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
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
