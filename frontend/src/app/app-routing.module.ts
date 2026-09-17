import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './admin/dashboard.component';
import { AdminVendorsComponent } from './admin/vendors.component';
import { VendorDetailComponent } from './admin/vendor-detail.component';
import { AdminPurchaseOrdersComponent } from './admin/purchase-orders.component';
import { MyOrdersComponent } from './vendor/my-orders.component';
import { MyPerformanceComponent } from './vendor/my-performance.component';
import { SuperDashboardComponent } from './super-admin/super-dashboard.component';
import { StoreDashboardComponent } from './store/store-dashboard.component';
import { RiderDashboardComponent } from './rider/rider-dashboard.component';
import { TrackComponent } from './track/track.component';
import { CustomerDashboardComponent } from './customer/customer-dashboard.component';
import { LandingComponent } from './landing/landing.component';
import { SupplyDashboardComponent } from './supply/supply-dashboard.component';
import { EmergencyComponent } from './emergency/emergency.component';
import { ShopDirectoryComponent } from './directory/shop-directory.component';
import { ShopDetailComponent } from './directory/shop-detail.component';
import { SalesDashboardComponent } from './sales/sales-dashboard.component';

import {
  authGuard,
  adminGuard,
  vendorGuard,
  superAdminGuard,
  storeOwnerGuard,
  riderGuard,
  customerGuard,
  supplyGuard,
  salesGuard,
} from './shared/guards';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // Public customer tracking link (no login required)
  { path: 'track/:id', component: TrackComponent },
  // Public and deliberately outside the auth layout: someone in an emergency,
  // or just looking for a shop's phone number, must never hit a login wall.
  { path: 'emergency', component: EmergencyComponent },
  { path: 'shops', component: ShopDirectoryComponent },
  { path: 'shop/:id', component: ShopDetailComponent },
  // Public marketing landing page (redirects signed-in users to their dashboard)
  { path: '', pathMatch: 'full', component: LandingComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      // Admin
      { path: 'admin', component: DashboardComponent, canActivate: [adminGuard] },
      { path: 'admin/vendors', component: AdminVendorsComponent, canActivate: [adminGuard] },
      { path: 'admin/vendors/:id', component: VendorDetailComponent, canActivate: [adminGuard] },
      { path: 'admin/purchase-orders', component: AdminPurchaseOrdersComponent, canActivate: [adminGuard] },
      // Vendor
      { path: 'vendor', component: MyOrdersComponent, canActivate: [vendorGuard] },
      { path: 'vendor/performance', component: MyPerformanceComponent, canActivate: [vendorGuard] },
      // RideFleet role dashboards
      { path: 'super', component: SuperDashboardComponent, canActivate: [superAdminGuard] },
      { path: 'store', component: StoreDashboardComponent, canActivate: [storeOwnerGuard] },
      { path: 'rider', component: RiderDashboardComponent, canActivate: [riderGuard] },
      { path: 'customer', component: CustomerDashboardComponent, canActivate: [customerGuard] },
      { path: 'supply', component: SupplyDashboardComponent, canActivate: [supplyGuard] },
      { path: 'sales', component: SalesDashboardComponent, canActivate: [salesGuard] },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
