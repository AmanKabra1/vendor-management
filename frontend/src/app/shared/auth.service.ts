import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'vendor';
  vendorId: number | null;
}

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

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('auth/login', { email, password })
      .pipe(tap((res) => this.persist(res)));
  }

  register(data: {
    name: string;
    email: string;
    password: string;
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
