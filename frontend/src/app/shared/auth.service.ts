import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export type UserRole =
  | 'super_admin'
  | 'store_owner'
  | 'rider'
  | 'customer'
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
  vendorId: string | null;
}

/** Landing route for each role after login. */
export const HOME_BY_ROLE: Record<UserRole, string> = {
  super_admin: '/super',
  store_owner: '/store',
  rider: '/rider',
  customer: '/store',
  admin: '/super', // legacy admin acts as the platform super-admin
  vendor: '/vendor',
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

  get isRider(): boolean {
    return this.currentUser?.role === 'rider';
  }

  /** Where this user should land after login. */
  get home(): string {
    return this.currentUser ? HOME_BY_ROLE[this.currentUser.role] : '/login';
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
    this.router.navigate(['/login']);
  }
}
