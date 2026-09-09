import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export type UserRole =
  | 'super_admin'
  | 'store_owner'
  | 'store_staff'
  | 'rider'
  | 'customer'
  | 'wholesaler'
  | 'distributor'
  | 'sales'
  | 'service_provider'
  | 'admin'
  | 'vendor';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  isApproved?: boolean;
  isVerified?: boolean;
  preferredLanguage?: string;
  /** Counter staff: the shop they're attached to. */
  storeId?: string | null;
  vendorId: string | null;
}

/** Landing route for each role after login. */
export const HOME_BY_ROLE: Record<UserRole, string> = {
  super_admin: '/super',
  store_owner: '/store',
  store_staff: '/store', // same counter, fewer settings
  rider: '/rider',
  customer: '/customer',
  wholesaler: '/supply',
  distributor: '/supply',
  sales: '/sales',
  service_provider: '/store', // a service listing is a shop with no shelves
  admin: '/super', // legacy admin acts as the platform super-admin
  vendor: '/vendor',
};

/** Label + icon for every "face" of the platform, used across the UI. */
export const ROLE_META: Record<
  UserRole,
  { en: string; hi: string; icon: string; desc: string; descHi: string }
> = {
  customer: {
    en: 'Customer', hi: 'ग्राहक', icon: '🛒',
    desc: 'Order from shops near you, pay cash or on your khata.',
    descHi: 'आस-पास की दुकानों से ऑर्डर करें, नकद या खाते पर।',
  },
  store_owner: {
    en: 'Shop owner', hi: 'दुकान मालिक', icon: '🏪',
    desc: 'Any shop — kirana, medical, water, gas, sabzi, hardware.',
    descHi: 'कोई भी दुकान — किराना, मेडिकल, पानी, गैस, सब्ज़ी।',
  },
  store_staff: {
    en: 'Shop staff', hi: 'दुकान स्टाफ', icon: '🧑‍💼',
    desc: 'Work the counter: take orders and write the khata.',
    descHi: 'काउंटर संभालें: ऑर्डर लें और खाता लिखें।',
  },
  rider: {
    en: 'Delivery rider', hi: 'डिलीवरी राइडर', icon: '🛵',
    desc: 'Deliver for any shop in town, on your own hours.',
    descHi: 'शहर की किसी भी दुकान के लिए, अपने समय पर।',
  },
  wholesaler: {
    en: 'Wholesaler', hi: 'थोक विक्रेता', icon: '🏭',
    desc: 'Sell in bulk to shops and distributors.',
    descHi: 'दुकानों और वितरकों को थोक में बेचें।',
  },
  distributor: {
    en: 'Distributor', hi: 'वितरक', icon: '🚚',
    desc: 'Buy from wholesalers, supply the shops.',
    descHi: 'थोक से खरीदें, दुकानों को सप्लाई करें।',
  },
  service_provider: {
    en: 'Service provider', hi: 'सेवा प्रदाता', icon: '🛠️',
    desc: 'Electrician, plumber, mechanic, tanker, tempo.',
    descHi: 'बिजली मिस्त्री, प्लंबर, मैकेनिक, टैंकर, टेम्पो।',
  },
  sales: {
    en: 'Field sales agent', hi: 'फील्ड सेल्स एजेंट', icon: '📋',
    desc: 'Sign up shops in your town and earn per shop.',
    descHi: 'अपने शहर की दुकानें जोड़ें, प्रति दुकान कमाएँ।',
  },
  super_admin: {
    en: 'Platform admin', hi: 'प्लेटफ़ॉर्म एडमिन', icon: '🛡️',
    desc: 'Approves shops and riders, runs the platform.',
    descHi: 'दुकानों और राइडर को मंज़ूरी देता है।',
  },
  admin: {
    en: 'Admin', hi: 'एडमिन', icon: '🛡️',
    desc: 'Platform administrator.',
    descHi: 'प्लेटफ़ॉर्म एडमिन।',
  },
  vendor: {
    en: 'Vendor', hi: 'वेंडर', icon: '📦',
    desc: 'Legacy vendor account.',
    descHi: 'पुराना वेंडर अकाउंट।',
  },
};

interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'vm_token';
const USER_KEY = 'vm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<AuthUser | null>(this.loadUser());
  user$ = this.userSubject.asObservable();

  constructor(private api: ApiService, private router: Router) {}

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  get isVendor(): boolean {
    return this.currentUser?.role === 'vendor';
  }

  get isSuperAdmin(): boolean {
    return this.currentUser?.role === 'super_admin';
  }

  /** Platform admin = SuperAdmin or the legacy admin account. */
  get isPlatformAdmin(): boolean {
    return this.isSuperAdmin || this.isAdmin;
  }

  get isStoreOwner(): boolean {
    return this.currentUser?.role === 'store_owner';
  }

  get isStoreStaff(): boolean {
    return this.currentUser?.role === 'store_staff';
  }

  get isServiceProvider(): boolean {
    return this.currentUser?.role === 'service_provider';
  }

  /**
   * Anyone who works a shop counter. Staff share the owner's screens minus the
   * settings, because in a real shop whoever is standing there takes the order.
   */
  get isStoreSide(): boolean {
    return this.isStoreOwner || this.isStoreStaff || this.isServiceProvider;
  }

  get isSalesAgent(): boolean {
    return this.currentUser?.role === 'sales';
  }

  get isRider(): boolean {
    return this.currentUser?.role === 'rider';
  }

  get isCustomer(): boolean {
    return this.currentUser?.role === 'customer';
  }

  get isWholesaler(): boolean {
    return this.currentUser?.role === 'wholesaler';
  }

  get isDistributor(): boolean {
    return this.currentUser?.role === 'distributor';
  }

  /** Can sell on the supply chain (lists a product catalog). */
  get isSupplier(): boolean {
    return this.isWholesaler || this.isDistributor;
  }

  /** Sees the Supply area at all (suppliers + buyers). */
  get isSupplyParticipant(): boolean {
    return this.isWholesaler || this.isDistributor || this.isStoreOwner;
  }

  /** Where this user should land after login. */
  get home(): string {
    const role = this.currentUser?.role;
    return role ? HOME_BY_ROLE[role] ?? '/customer' : '/login';
  }

  /**
   * Patches the cached user (e.g. after saving a profile or language).
   * No-ops when there's no cached user, so a stray call can't invent a
   * half-populated account object that templates then read `.name` off.
   */
  patchUser(patch: Partial<AuthUser>) {
    const current = this.currentUser;
    if (!current) return;
    const next = { ...current, ...patch };
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    this.userSubject.next(next);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('auth/login', { email, password })
      .pipe(tap((res) => this.persist(res)));
  }

  register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    phone?: string;
    landline?: string;
    vendorCode?: string;
  }): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('auth/register', data)
      .pipe(tap((res) => this.persist(res)));
  }

  private persist(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.userSubject.next(res.user);
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSubject.next(null);
    // Return to the public landing page, not the login screen.
    this.router.navigate(['/']);
  }
}
