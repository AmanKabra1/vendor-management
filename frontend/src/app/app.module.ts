import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

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
import { MapComponent } from './shared/map.component';
import { TrackComponent } from './track/track.component';
import { ChatWidgetComponent } from './shared/chat-widget.component';
import { CustomerDashboardComponent } from './customer/customer-dashboard.component';
import { LandingComponent } from './landing/landing.component';
import { LocationPickerComponent } from './shared/location-picker.component';
import { KycComponent } from './shared/kyc.component';
import { SupplyDashboardComponent } from './supply/supply-dashboard.component';

import { AuthInterceptor } from './shared/auth.interceptor';
import { LoadingInterceptor } from './shared/loading.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    LayoutComponent,
    DashboardComponent,
    AdminVendorsComponent,
    VendorDetailComponent,
    AdminPurchaseOrdersComponent,
    MyOrdersComponent,
    MyPerformanceComponent,
    SuperDashboardComponent,
    StoreDashboardComponent,
    RiderDashboardComponent,
    MapComponent,
    TrackComponent,
    ChatWidgetComponent,
    CustomerDashboardComponent,
    LandingComponent,
    LocationPickerComponent,
    KycComponent,
    SupplyDashboardComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
