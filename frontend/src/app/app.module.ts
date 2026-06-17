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

import { AuthInterceptor } from './shared/auth.interceptor';

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
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
