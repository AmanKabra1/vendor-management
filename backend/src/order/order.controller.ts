import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import {
  CreateOrderDto,
  AssignRiderDto,
  DeliverDto,
  CancelOrderDto,
} from './dto/order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Roles(Role.StoreOwner, Role.Vendor, Role.SuperAdmin, Role.Admin)
  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
    return this.orderService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.orderService.findAll(user);
  }

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.orderService.stats(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orderService.findOne(id, user);
  }

  // Store assigns a rider (OTP generated here).
  @Roles(Role.StoreOwner, Role.Vendor, Role.SuperAdmin, Role.Admin)
  @Patch(':id/assign-rider')
  assignRider(
    @Param('id') id: string,
    @Body() dto: AssignRiderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.orderService.assignRider(id, dto.riderId, user);
  }

  // Rider actions.
  @Roles(Role.Rider, Role.SuperAdmin, Role.Admin)
  @Patch(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orderService.accept(id, user);
  }

  @Roles(Role.Rider, Role.SuperAdmin, Role.Admin)
  @Patch(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orderService.reject(id, user);
  }

  @Roles(Role.Rider, Role.SuperAdmin, Role.Admin)
  @Patch(':id/pickup')
  pickup(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orderService.pickup(id, user);
  }

  @Roles(Role.Rider, Role.SuperAdmin, Role.Admin)
  @Patch(':id/deliver')
  deliver(
    @Param('id') id: string,
    @Body() dto: DeliverDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.orderService.deliver(id, dto.otp, user);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.orderService.cancel(id, dto?.reason || '', user);
  }
}
