import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div class="auth-wrap">
      <div class="card shadow-sm auth-card">
        <div class="card-body p-4">
          <h3 class="mb-1 fw-bold text-primary">Create Vendor Account</h3>
          <p class="text-muted mb-4">Register to manage your orders & performance</p>

          <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>

          <form (ngSubmit)="submit()">
            <div class="mb-3">
              <label class="form-label">Company / Vendor Name</label>
              <input class="form-control" name="name" [(ngModel)]="form.name" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input class="form-control" type="email" name="email" [(ngModel)]="form.email" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Password</label>
              <input class="form-control" type="password" name="password" [(ngModel)]="form.password" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Existing Vendor Code <span class="text-muted">(optional)</span></label>
              <input class="form-control" name="vendorCode" [(ngModel)]="form.vendorCode" placeholder="Leave blank to create a new profile" />
            </div>
            <button class="btn btn-primary w-100" [disabled]="loading">
              {{ loading ? 'Creating…' : 'Register' }}
            </button>
          </form>

          <p class="text-center mt-3 mb-0">
            Already registered? <a routerLink="/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  form = { name: '', email: '', password: '', vendorCode: '' };
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    this.loading = true;
    const payload = {
      name: this.form.name,
      email: this.form.email,
      password: this.form.password,
      ...(this.form.vendorCode ? { vendorCode: this.form.vendorCode } : {}),
    };
    this.auth.register(payload).subscribe({
      next: () => this.router.navigate(['/vendor']),
      error: (err) => {
        this.error = err?.error?.message || 'Registration failed';
        this.loading = false;
      },
    });
  }
}
