import { Controller, Get, Param } from '@nestjs/common';
import { OrderService } from './order.service';

// Public, no auth — backs the shareable customer tracking link.
@Controller('track')
export class PublicTrackingController {
  constructor(private readonly orderService: OrderService) {}

  @Get(':id')
  track(@Param('id') id: string) {
    return this.orderService.publicTracking(id);
  }
}
