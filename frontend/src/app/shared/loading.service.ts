import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Tracks how many HTTP requests are in flight so the UI can show a global
 * activity bar. Counts requests (not just a boolean) so overlapping calls
 * don't switch the indicator off too early.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  start() {
    this.count++;
    if (this.count === 1) this.loadingSubject.next(true);
  }

  stop() {
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) this.loadingSubject.next(false);
  }
}
