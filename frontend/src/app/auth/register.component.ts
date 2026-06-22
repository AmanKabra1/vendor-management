import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserRole } from '../shared/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div class="auth-wrap">
      <div class="card shadow-sm auth-card">
        <div class="card-body p-4">
          <h3 class="mb-1 fw-bold text-primary">Create Account</h3>
          <p class="text-muted mb-4">Join the RideFleet platform</p>

          <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>

          <div class="mb-3">
            <label class="form-label">I am a…</label>
            <div class="d-flex flex-wrap gap-2">
              <button type="button" class="btn btn-sm" *ngFor="let r of roles"
                [class.btn-primary]="form.role===r.key" [class.btn-outline-primary]="form.role!==r.key"
                (click)="form.role=r.key">{{ r.label }}</button>
            </div>
          </div>

          <form (ngSubmit)="submit()">
            <div class="mb-3">
              <label class="form-label">{{ form.role === 'store_owner' ? 'Store / Company Name' : 'Full Name' }}</label>
              <input class="form-control" name="name" [(ngModel)]="form.name" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input class="form-control" type="email" name="email" [(ngModel)]="form.email" required />
            </div>
            <div class="mb-3">
              <app-phone-input label="Mobile" name="phone" placeholder="Mobile number"
                (valueChange)="form.phone=$event" (validChange)="phoneValid=$event"></app-phone-input>
            </div>
            <div class="mb-3">
              <app-phone-input label="Landline (optional)" name="landline" placeholder="Landline number"
                (valueChange)="form.landline=$event" (validChange)="landlineValid=$event"></app-phone-input>
              <div class="form-text">Provide a mobile or a landline — at least one is required.</div>
            </div>
            <div class="alert alert-warning py-2" *ngIf="contactError">{{ contactError }}</div>
            <div class="mb-3">
              <label class="form-label">Password</label>
              <div class="input-group">
                <input class="form-control" [type]="showPw ? 'text' : 'password'" name="password" [(ngModel)]="form.password" required />
                <button class="btn btn-outline-secondary" type="button" (click)="showPw = !showPw" [attr.aria-label]="showPw ? 'Hide password' : 'Show password'">
                  {{ showPw ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>
            <button class="btn btn-primary w-100" [disabled]="loading">
              {{ loading ? 'Creating…' : 'Register' }}
            </button>
          </form>

          <p *ngIf="form.role==='store_owner' || form.role==='rider'" class="text-muted small mt-3 mb-0">
            Note: {{ form.role === 'store_owner' ? 'stores' : 'riders' }} require admin approval before going live.
          </p>
          <p class="text-center mt-3 mb-0">
            Already registered? <a routerLink="/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  roles: { key: UserRole; label: string }[] = [
    { key: 'store_owner', label: 'Store / Kirana' },
    { key: 'rider', label: 'Rider' },
    { key: 'customer', label: 'Customer' },
    { key: 'wholesaler', label: 'Wholesaler' },
    { key: 'distributor', label: 'Distributor' },
  ];
  form: { name: string; email: string; phone: string; landline: string; password: string; role: UserRole } = {
    name: '',
    email: '',
    phone: '',
    landline: '',
    password: '',
    role: 'store_owner',
  };
  phoneValid = true;
  landlineValid = true;
  contactError = '';
  showPw = false;
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    this.contactError = '';

    // At least one contact number is required, and any entered number must be valid.
    if (!this.form.phone && !this.form.landline) {
      this.contactError = 'Please enter a mobile or a landline number.';
      return;
    }
    if (!this.phoneValid || !this.landlineValid) {
      this.contactError = 'Please fix the highlighted phone number.';
      return;
    }

    this.loading = true;
    this.auth
      .register({
        name: this.form.name,
        email: this.form.email,
        password: this.form.password,
        phone: this.form.phone,
        landline: this.form.landline,
        role: this.form.role,
      })
      .subscribe({
        next: () => this.router.navigateByUrl(this.auth.home),
        error: (err) => {
          this.error = err?.error?.message || 'Registration failed';
          this.loading = false;
        },
      });
  }
}
