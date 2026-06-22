import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /** Lightweight health payload for uptime monitors and load-balancer checks. */
  health() {
    return {
      status: 'ok',
      service: 'vendor-management-api',
      uptime: Math.round(process.uptime()),
      time: new Date().toISOString(),
    };
  }
}
