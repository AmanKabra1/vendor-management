import { Component, OnInit } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-kyc',
  standalone: false,
  template: `
    <div class="card border-0 mb-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>Identity verification (KYC)</span>
        <span class="badge" [ngClass]="verified ? 'bg-success' : 'bg-warning text-dark'">
          {{ verified ? 'Verified' : 'Not verified' }}
        </span>
      </div>
      <div class="card-body">
        <div *ngIf="verified" class="text-success mb-0">
          ✅ Aadhaar verified <span class="text-muted">({{ masked }})</span>
        </div>
        <div *ngIf="!verified">
          <p class="text-muted small mb-2">Verify your Aadhaar to build trust on the platform.</p>
          <div class="d-flex gap-2" style="max-width:380px">
            <input class="form-control" [(ngModel)]="aadhaar" name="aadhaar" placeholder="12-digit Aadhaar" maxlength="14">
            <button class="btn btn-primary text-nowrap" (click)="verify()" [disabled]="busy">Verify</button>
          </div>
          <small class="text-danger" *ngIf="error">{{ error }}</small>
          <small class="text-muted d-block mt-1">Demo/sandbox — try a valid test number like 9999 9999 0019.</small>
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

  constructor(private api: ApiService, private auth: AuthService) {}

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
        this.error = e?.error?.message || 'Verification failed';
      },
    });
  }
}
