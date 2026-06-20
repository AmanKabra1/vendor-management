import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SupplyOrderService } from './supply-order.service';
import { CreateSupplyOrderDto } from './dto/supply-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('supply-orders')
export class SupplyOrderController {
  constructor(private readonly service: SupplyOrderService) {}

  // Buyers: kirana store owners and distributors (restocking).
  @Roles(Role.StoreOwner, Role.Distributor, Role.Vendor)
  @Post()
  create(@Body() dto: CreateSupplyOrderDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.userId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user);
  }

  @Patch(':id/advance')
  advance(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.advance(id, user);
  }

  @Patch(':id/receive')
  receive(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.receive(id, user);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.cancel(id, user);
  }
}
