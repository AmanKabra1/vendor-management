import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { finalize } from 'rxjs';
import { LoadingService } from './loading.service';

/** Drives the global activity bar: counts every HTTP request in flight. */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loading: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Don't flash the bar for background tracking polls (every few seconds).
    const isPoll = /\/track\//.test(req.url) || /\/location$/.test(req.url);
    if (isPoll) return next.handle(req);

    this.loading.start();
    return next.handle(req).pipe(finalize(() => this.loading.stop()));
  }
}
