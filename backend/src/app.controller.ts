import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Root + /health both return 200 so uptime monitors (UptimeRobot) don't see a 404.
  @Get()
  root() {
    return this.appService.health();
  }

  @Get('health')
  health() {
    return this.appService.health();
  }
}
