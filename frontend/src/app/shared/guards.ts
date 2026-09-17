import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Requires a logged-in user. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn) return true;
  router.navigate(['/login']);
  return false;
};

/**
 * Requires platform-admin access (legacy admin OR super_admin). The legacy
 * procurement screens (/admin/vendors, /admin/purchase-orders) are linked from
 * the super-admin console, so a super_admin must be allowed through too — else
 * those buttons bounce to the wrong place and appear dead.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn && auth.isPlatformAdmin) return true;
  router.navigate([auth.isLoggedIn ? auth.home : '/login']);
  return false;
};

/** Requires the vendor role. */
export const vendorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn && auth.isVendor) return true;
  router.navigate([auth.isLoggedIn ? auth.home : '/login']);
  return false;
};

/** Builds a guard that requires one of the given roles, else routes home/login. */
const requireRole = (check: (a: AuthService) => boolean): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isLoggedIn && check(auth)) return true;
    router.navigate([auth.isLoggedIn ? auth.home : '/login']);
    return false;
  };
};

export const superAdminGuard = requireRole((a) => a.isPlatformAdmin);
/** Owner, counter staff and service providers all share the shop screens. */
export const storeOwnerGuard = requireRole((a) => a.isStoreSide);
export const riderGuard = requireRole((a) => a.isRider);
export const customerGuard = requireRole((a) => a.isCustomer);
export const supplyGuard = requireRole((a) => a.isSupplyParticipant);
export const salesGuard = requireRole((a) => a.isSalesAgent || a.isPlatformAdmin);
