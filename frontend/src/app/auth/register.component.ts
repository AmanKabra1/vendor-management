import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, ROLE_META, UserRole } from '../shared/auth.service';
import { I18nService } from '../shared/i18n.service';

/** Roles a visitor may pick for themselves, in the order they matter locally. */
const SIGNUP_ROLES: UserRole[] = [
  'customer',
  'store_owner',
  'rider',
  'store_staff',
  'service_provider',
  'wholesaler',
  'distributor',
  'sales',
];

const NEEDS_APPROVAL: UserRole[] = [
  'store_owner',
  'rider',
  'wholesaler',
  'distributor',
  'sales',
  'service_provider',
];

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <div class="auth-wrap">
      <div class="card shadow-sm auth-card">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <h3 class="mb-0 fw-bold text-primary">{{ 'reg.title' | t }}</h3>
            <button class="rf-chip" (click)="i18n.toggleLang()">
              🌐 {{ i18n.lang() === 'en' ? 'हिंदी' : 'English' }}
            </button>
          </div>
          <p class="text-muted mb-4">{{ 'app.name' | t }} · {{ 'app.tagline' | t }}</p>

          <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>

          <!-- Role picker: a card per "face" of the platform, with what each one
               actually does. A shopkeeper should not have to guess whether they
               are a "vendor" or a "store owner". -->
          <div class="mb-3">
            <label class="form-label">{{ 'reg.whoAreYou' | t }}</label>
            <div class="rf-roles">
              <button type="button" class="rf-role" *ngFor="let r of roles"
                      [class.active]="form.role === r" (click)="form.role = r">
                <div class="rf-role-ic">{{ meta(r).icon }}</div>
                <div class="rf-role-name">{{ i18n.pick(meta(r).en, meta(r).hi) }}</div>
                <div class="rf-role-desc">{{ i18n.pick(meta(r).desc, meta(r).descHi) }}</div>
              </button>
            </div>
          </div>

          <form (ngSubmit)="submit()">
            <div class="mb-3">
              <label class="form-label">
                {{ form.role === 'store_owner'
                    ? (i18n.lang() === 'hi' ? 'दुकान का नाम' : 'Shop name')
                    : ('common.name' | t) }}
              </label>
              <input class="form-control" name="name" [(ngModel)]="form.name" required />
            </div>
            <div class="mb-3">
              <label class="form-label">{{ 'common.email' | t }}</label>
              <input class="form-control" type="email" name="email" [(ngModel)]="form.email" required />
            </div>
            <div class="mb-3">
              <app-phone-input [label]="'common.phone' | t" name="phone"
                [placeholder]="'common.phone' | t"
                (valueChange)="form.phone = $event" (validChange)="phoneValid = $event"></app-phone-input>
              <div class="form-text">
                {{ i18n.lang() === 'hi'
                    ? 'यही नंबर आपके उधार खाते से जुड़ेगा।'
                    : 'This number links you to your khata at any shop.' }}
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">
                {{ i18n.lang() === 'hi' ? 'लैंडलाइन (वैकल्पिक)' : 'Landline (optional)' }}
              </label>
              <input class="form-control" name="landline" inputmode="numeric"
                [placeholder]="'reg.landlinePlaceholder' | t" [(ngModel)]="form.landline">
              <div class="form-text">
                {{ i18n.lang() === 'hi'
                    ? 'मोबाइल या लैंडलाइन — कम से कम एक ज़रूरी है।'
                    : 'Provide a mobile or a landline — at least one is required.' }}
              </div>
            </div>
            <div class="alert alert-warning py-2" *ngIf="contactError">{{ contactError }}</div>
            <div class="mb-3">
              <label class="form-label">
                {{ i18n.lang() === 'hi' ? 'पासवर्ड' : 'Password' }}
              </label>
              <div class="input-group">
                <input class="form-control" [type]="showPw ? 'text' : 'password'" name="password"
                       [(ngModel)]="form.password" required />
                <button class="btn btn-outline-secondary" type="button" (click)="showPw = !showPw"
                        [attr.aria-label]="showPw ? 'Hide password' : 'Show password'">
                  {{ showPw ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>
            <button class="btn btn-primary btn-lg w-100" [disabled]="loading">
              {{ loading ? '…' : ('nav.register' | t) }}
            </button>
          </form>

          <p *ngIf="needsApproval" class="text-muted small mt-3 mb-0">
            ⏳ {{ 'reg.needApproval' | t }}
          </p>
          <p class="text-center mt-3 mb-0">
            <a routerLink="/login">{{ 'nav.login' | t }}</a>
            &nbsp;·&nbsp;
            <a routerLink="/shops">{{ 'nav.shops' | t }}</a>
            &nbsp;·&nbsp;
            <a routerLink="/emergency" class="text-danger">🆘 {{ 'nav.emergency' | t }}</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  roles = SIGNUP_ROLES;
  meta = (r: UserRole) => ROLE_META[r];

  form: {
    name: string;
    email: string;
    phone: string;
    landline: string;
    password: string;
    role: UserRole;
  } = {
    name: '',
    email: '',
    phone: '',
    landline: '',
    password: '',
    role: 'customer',
  };

  phoneValid = true;
  landlineValid = true;
  contactError = '';
  showPw = false;
  error = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    public i18n: I18nService,
  ) {}

  get needsApproval(): boolean {
    return NEEDS_APPROVAL.includes(this.form.role);
  }

  submit() {
    this.error = '';
    this.contactError = '';

    // At least one contact number is required, and any entered number must be valid.
    if (!this.form.phone && !this.form.landline) {
      this.contactError =
        this.i18n.lang() === 'hi'
          ? 'कृपया मोबाइल या लैंडलाइन नंबर डालें।'
          : 'Please enter a mobile or a landline number.';
      return;
    }
    if (!this.phoneValid || !this.landlineValid) {
      this.contactError =
        this.i18n.lang() === 'hi'
          ? 'कृपया नंबर ठीक करें।'
          : 'Please fix the highlighted phone number.';
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
