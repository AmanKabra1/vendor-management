export enum Role {
  // RideFleet platform roles
  SuperAdmin = 'super_admin', // platform owner — approves stores & riders
  StoreOwner = 'store_owner', // owns an outlet/store, creates delivery orders
  Rider = 'rider', // delivery rider — accepts and fulfills orders
  Customer = 'customer', // places / receives deliveries

  // Legacy vendor-management roles (kept for backward compatibility)
  Admin = 'admin',
  Vendor = 'vendor',
}

// Roles that require SuperAdmin approval before they can operate.
export const APPROVAL_REQUIRED_ROLES: Role[] = [Role.StoreOwner, Role.Rider];
