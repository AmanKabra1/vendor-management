import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiBaseUrl } from './api-url';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // Runtime override (localStorage) or the build-time URL; no trailing slash.
  private baseUrl = apiBaseUrl();

  constructor(private http: HttpClient) {}

  get<T = any>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`);
  }

  post<T = any>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, data);
  }

  put<T = any>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, data);
  }

  patch<T = any>(endpoint: string, data: any = {}): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${endpoint}`, data);
  }

  delete<T = any>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`);
  }
}
