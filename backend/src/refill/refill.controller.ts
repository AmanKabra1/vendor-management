import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RefillService } from './refill.service';
import { CreateRefillDto, UpdateRefillDto } from './dto/refill.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

/** Standing orders: water cans, gas cylinders, milk, cattle feed. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('refills')
export class RefillController {
  constructor(private readonly refills: RefillService) {}

  @Roles(Role.Customer, Role.SuperAdmin, Role.Admin)
  @Post()
  create(@Body() dto: CreateRefillDto, @CurrentUser() user: AuthUser) {
    return this.refills.create(dto, user);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.refills.mine(user);
  }

  /** The shop's round for today, plus what's coming up. */
  @Roles(Role.StoreOwner, Role.StoreStaff, Role.SuperAdmin, Role.Admin)
  @Get('store/:storeId')
  forStore(@Param('storeId') storeId: string, @CurrentUser() user: AuthUser) {
    return this.refills.forStore(storeId, user);
  }

  @Roles(Role.StoreOwner, Role.StoreStaff, Role.SuperAdmin, Role.Admin)
  @Patch(':id/delivered')
  delivered(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.refills.markDelivered(id, user);
  }

  @Patch(':id/snooze')
  snooze(
    @Param('id') id: string,
    @Body('days') days: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.refills.snooze(id, Number(days) || 3, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRefillDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.refills.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.refills.remove(id, user);
  }
}
