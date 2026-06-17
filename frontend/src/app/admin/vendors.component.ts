import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';

@Component({
  selector: 'app-admin-vendors',
  standalone: false,
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="mb-0">Vendors</h3>
      <button class="btn btn-primary" (click)="openCreate()">+ Add Vendor</button>
    </div>

    <input
      class="form-control mb-3"
      style="max-width: 320px"
      placeholder="Search by name or code…"
      [(ngModel)]="search"
    />

    <div class="card shadow-sm border-0">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Name</th><th>Code</th><th>Contact</th><th>Address</th>
              <th>On-Time</th><th>Quality</th><th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of filtered">
              <td class="fw-semibold">{{ v.name }}</td>
              <td>{{ v.vendorCode }}</td>
              <td>{{ v.contactDetails }}</td>
              <td>{{ v.address }}</td>
              <td>{{ v.onTimeDeliveryRate | number: '1.0-1' }}%</td>
              <td>{{ v.qualityRatingAvg | number: '1.0-2' }}</td>
              <td class="text-end text-nowrap">
                <a class="btn btn-sm btn-outline-secondary me-1" [routerLink]="['/admin/vendors', v.id]">View</a>
                <button class="btn btn-sm btn-outline-primary me-1" (click)="openEdit(v)">Edit</button>
                <button class="btn btn-sm btn-outline-danger" (click)="remove(v)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="!filtered.length">
              <td colspan="7" class="text-center text-muted py-4">No vendors found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal-ish editor -->
    <div class="modal-backdrop-custom" *ngIf="showForm" (click)="close()">
      <div class="card shadow editor-card" (click)="$event.stopPropagation()">
        <div class="card-header bg-white fw-semibold">
          {{ editing ? 'Edit Vendor' : 'Add Vendor' }}
        </div>
        <div class="card-body">
          <div *ngIf="error" class="alert alert-danger py-2">{{ error }}</div>
          <div class="mb-2">
            <label class="form-label">Name</label>
            <input class="form-control" name="name" [(ngModel)]="form.name" />
          </div>
          <div class="mb-2">
            <label class="form-label">Vendor Code</label>
            <input class="form-control" name="vendorCode" [(ngModel)]="form.vendorCode" [disabled]="editing" />
          </div>
          <div class="mb-2">
            <label class="form-label">Contact Details</label>
            <input class="form-control" name="contactDetails" [(ngModel)]="form.contactDetails" />
          </div>
          <div class="mb-2">
            <label class="form-label">Address</label>
            <input class="form-control" name="address" [(ngModel)]="form.address" />
          </div>
        </div>
        <div class="card-footer bg-white text-end">
          <button class="btn btn-light me-2" (click)="close()">Cancel</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving">Save</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `.modal-backdrop-custom { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; z-index: 1050; }`,
    `.editor-card { width: 100%; max-width: 460px; }`,
  ],
})
export class AdminVendorsComponent implements OnInit {
  vendors: any[] = [];
  search = '';
  showForm = false;
  editing: any = null;
  saving = false;
  error = '';
  form = { name: '', vendorCode: '', contactDetails: '', address: '' };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.get('vendors').subscribe((v) => (this.vendors = v));
  }

  get filtered() {
    const q = this.search.toLowerCase().trim();
    if (!q) return this.vendors;
    return this.vendors.filter(
      (v) =>
        v.name?.toLowerCase().includes(q) ||
        v.vendorCode?.toLowerCase().includes(q),
    );
  }

  openCreate() {
    this.editing = null;
    this.error = '';
    this.form = { name: '', vendorCode: '', contactDetails: '', address: '' };
    this.showForm = true;
  }

  openEdit(v: any) {
    this.editing = v;
    this.error = '';
    this.form = {
      name: v.name,
      vendorCode: v.vendorCode,
      contactDetails: v.contactDetails,
      address: v.address,
    };
    this.showForm = true;
  }

  close() {
    this.showForm = false;
  }

  save() {
    this.saving = true;
    this.error = '';
    const done = {
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.load();
      },
      error: (err: any) => {
        this.saving = false;
        this.error = err?.error?.message || 'Save failed';
      },
    };
    if (this.editing) {
      this.api.put(`vendors/${this.editing.id}`, this.form).subscribe(done);
    } else {
      this.api.post('vendors', this.form).subscribe(done);
    }
  }

  remove(v: any) {
    if (!confirm(`Delete vendor "${v.name}"?`)) return;
    this.api.delete(`vendors/${v.id}`).subscribe(() => this.load());
  }
}
