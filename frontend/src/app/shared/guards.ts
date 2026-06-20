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

/** Requires the admin role. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn && auth.isAdmin) return true;
  router.navigate([auth.isLoggedIn ? '/vendor' : '/login']);
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
export const storeOwnerGuard = requireRole((a) => a.isStoreOwner);
export const riderGuard = requireRole((a) => a.isRider);
export const customerGuard = requireRole((a) => a.isCustomer);
export const supplyGuard = requireRole((a) => a.isSupplyParticipant);
