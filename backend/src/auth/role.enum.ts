export enum Role {
  // RideFleet platform roles
  SuperAdmin = 'super_admin', // platform owner — approves stores & riders
  StoreOwner = 'store_owner', // owns an outlet/kirana store, creates delivery orders
  StoreStaff = 'store_staff', // works the counter for a store — takes orders, writes khata
  Rider = 'rider', // delivery rider — accepts and fulfills orders
  Customer = 'customer', // places / receives deliveries
  Wholesaler = 'wholesaler', // lists bulk products for distributors/retailers
  Distributor = 'distributor', // middleman — buys from wholesalers, sells to kiranas
  Sales = 'sales', // field agent — onboards shops in a town, works a lead pipeline
  ServiceProvider = 'service_provider', // electrician, plumber, tanker, mechanic…

  // Legacy vendor-management roles (kept for backward compatibility)
  Admin = 'admin',
  Vendor = 'vendor',
}

// Roles that require SuperAdmin approval before they can operate.
export const APPROVAL_REQUIRED_ROLES: Role[] = [
  Role.StoreOwner,
  Role.Rider,
  Role.Wholesaler,
  Role.Distributor,
  Role.Sales,
  Role.ServiceProvider,
];

// Supplier roles an admin reviews on the "Suppliers" tab.
export const SUPPLIER_ROLES: Role[] = [Role.Wholesaler, Role.Distributor];

// Roles a visitor may pick for themselves on the register screen.
export const SELF_SIGNUP_ROLES: Role[] = [
  Role.StoreOwner,
  Role.StoreStaff,
  Role.Rider,
  Role.Customer,
  Role.Wholesaler,
  Role.Distributor,
  Role.Sales,
  Role.ServiceProvider,
];
