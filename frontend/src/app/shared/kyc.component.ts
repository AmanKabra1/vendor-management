import { Component, OnInit } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { I18nService } from './i18n.service';

@Component({
  selector: 'app-kyc',
  standalone: false,
  template: `
    <div class="card border-0 mb-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>{{ 'kyc.title' | t }} <span class="text-muted small">· {{ 'common.optional' | t }}</span></span>
        <span class="badge" [ngClass]="verified ? 'bg-success' : 'bg-secondary'">
          {{ (verified ? 'kyc.verified' : 'kyc.optionalBadge') | t }}
        </span>
      </div>
      <div class="card-body">
        <div *ngIf="verified" class="text-success mb-0">
          ✅ {{ 'kyc.done' | t }} <span class="text-muted">({{ masked }})</span>
        </div>
        <div *ngIf="!verified">
          <p class="text-muted small mb-2">{{ 'kyc.blurb' | t }}</p>
          <div class="d-flex gap-2" style="max-width:380px">
            <input class="form-control" [(ngModel)]="aadhaar" name="aadhaar" [placeholder]="'kyc.aadhaar' | t" maxlength="14">
            <button class="btn btn-primary text-nowrap" (click)="verify()" [disabled]="busy">{{ 'kyc.verify' | t }}</button>
          </div>
          <small class="text-danger" *ngIf="error">{{ error }}</small>
          <small class="text-muted d-block mt-1">{{ 'kyc.demoNote' | t }}</small>

          <div class="d-flex align-items-center my-3" style="max-width:380px">
            <hr class="flex-grow-1"><span class="px-2 text-muted small">{{ 'kyc.or' | t }}</span><hr class="flex-grow-1">
          </div>
          <button class="btn btn-outline-dark" (click)="verifyDigilocker()" [disabled]="busy">
            🔐 {{ 'kyc.digilocker' | t }}
          </button>
          <small class="text-muted d-block mt-1">{{ 'kyc.digilockerNote' | t }}</small>
        </div>
      </div>
    </div>
  `,
})
export class KycComponent implements OnInit {
  verified = false;
  masked = '';
  aadhaar = '';
  busy = false;
  error = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private i18n: I18nService,
  ) {}

  ngOnInit() {
    this.verified = !!this.auth.currentUser?.isVerified;
  }

  verify() {
    this.error = '';
    this.busy = true;
    this.api.post('verification/aadhaar', { aadhaar: this.aadhaar }).subscribe({
      next: (r: any) => {
        this.busy = false;
        this.verified = true;
        this.masked = r.aadhaarMasked;
      },
      error: (e) => {
        this.busy = false;
        this.error = e?.error?.message || this.i18n.t('kyc.failed');
      },
    });
  }

  verifyDigilocker() {
    // Simulates the DigiLocker consent redirect. The real flow sends the user
    // to DigiLocker and returns via a callback; here we confirm consent inline.
    if (!confirm(this.i18n.t('kyc.digilockerConfirm'))) return;
    this.error = '';
    this.busy = true;
    this.api.post('verification/digilocker', {}).subscribe({
      next: (r: any) => {
        this.busy = false;
        this.verified = true;
        this.masked = r.aadhaarMasked;
      },
      error: (e) => {
        this.busy = false;
        this.error = e?.error?.message || 'DigiLocker verification failed';
      },
    });
  }
}
