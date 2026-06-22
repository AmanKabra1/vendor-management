import { Component, EventEmitter, Input, Output } from '@angular/core';

interface Country {
  iso: string;
  name: string;
  dial: string; // includes leading +
  min: number; // min national digits
  max: number; // max national digits
}

// India-first, then common countries. min/max = national number length (digits).
export const COUNTRIES: Country[] = [
  { iso: 'IN', name: 'India', dial: '+91', min: 10, max: 10 },
  { iso: 'US', name: 'United States', dial: '+1', min: 10, max: 10 },
  { iso: 'GB', name: 'United Kingdom', dial: '+44', min: 10, max: 10 },
  { iso: 'AE', name: 'United Arab Emirates', dial: '+971', min: 9, max: 9 },
  { iso: 'SG', name: 'Singapore', dial: '+65', min: 8, max: 8 },
  { iso: 'AU', name: 'Australia', dial: '+61', min: 9, max: 9 },
  { iso: 'CA', name: 'Canada', dial: '+1', min: 10, max: 10 },
  { iso: 'DE', name: 'Germany', dial: '+49', min: 10, max: 11 },
  { iso: 'FR', name: 'France', dial: '+33', min: 9, max: 9 },
  { iso: 'JP', name: 'Japan', dial: '+81', min: 10, max: 10 },
  { iso: 'CN', name: 'China', dial: '+86', min: 11, max: 11 },
  { iso: 'SA', name: 'Saudi Arabia', dial: '+966', min: 9, max: 9 },
  { iso: 'PK', name: 'Pakistan', dial: '+92', min: 10, max: 10 },
  { iso: 'BD', name: 'Bangladesh', dial: '+880', min: 10, max: 10 },
  { iso: 'NP', name: 'Nepal', dial: '+977', min: 10, max: 10 },
  { iso: 'LK', name: 'Sri Lanka', dial: '+94', min: 9, max: 9 },
  { iso: 'MY', name: 'Malaysia', dial: '+60', min: 9, max: 10 },
  { iso: 'ID', name: 'Indonesia', dial: '+62', min: 10, max: 12 },
  { iso: 'ZA', name: 'South Africa', dial: '+27', min: 9, max: 9 },
  { iso: 'BR', name: 'Brazil', dial: '+55', min: 10, max: 11 },
];

/**
 * Country-code + number input. Restricts entry to digits, caps length at the
 * selected country's maximum, and reports validity. Empty is treated as valid
 * (the field is optional); the parent decides if at least one is required.
 * Emits the full E.164-style value (e.g. "+919876543210") via (valueChange).
 */
@Component({
  selector: 'app-phone-input',
  standalone: false,
  template: `
    <label class="form-label" *ngIf="label">{{ label }}</label>
    <div class="input-group">
      <select class="form-select flex-grow-0" style="max-width:130px" [(ngModel)]="country" [name]="name + 'Cc'" (ngModelChange)="onChange()">
        <option *ngFor="let c of countries" [ngValue]="c">{{ c.iso }} {{ c.dial }}</option>
      </select>
      <input class="form-control" [name]="name" inputmode="numeric" [maxlength]="country.max"
             [(ngModel)]="number" (ngModelChange)="onInput($event)" [placeholder]="placeholder">
    </div>
    <div class="form-text text-danger" *ngIf="touched && number && !valid">
      Enter a valid {{ country.name }} number ({{ lengthHint }} digits).
    </div>
  `,
})
export class PhoneInputComponent {
  @Input() label = '';
  @Input() name = 'phone';
  @Input() placeholder = 'Number';
  @Output() valueChange = new EventEmitter<string>();
  @Output() validChange = new EventEmitter<boolean>();

  countries = COUNTRIES;
  country: Country = COUNTRIES[0];
  number = '';
  touched = false;

  get valid(): boolean {
    if (!this.number) return true; // empty = optional
    const len = this.number.length;
    return len >= this.country.min && len <= this.country.max;
  }

  get lengthHint(): string {
    return this.country.min === this.country.max
      ? `${this.country.min}`
      : `${this.country.min}–${this.country.max}`;
  }

  onInput(raw: string) {
    // Keep digits only, capped at the country's max length.
    const digits = (raw || '').replace(/\D/g, '').slice(0, this.country.max);
    if (digits !== this.number) this.number = digits;
    this.onChange();
  }

  onChange() {
    this.touched = true;
    this.valueChange.emit(this.number ? `${this.country.dial}${this.number}` : '');
    this.validChange.emit(this.valid);
  }
}
