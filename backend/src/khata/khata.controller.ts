import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { KhataService } from './khata.service';
import { CreateKhataEntryDto } from './dto/khata.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

/** The shop's udhaar book: goods on credit now, payment later. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('khata')
export class KhataController {
  constructor(private readonly khata: KhataService) {}

  /** A customer's own balances across every shop — read-only, no store id. */
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.khata.mine(user);
  }

  @Roles(Role.StoreOwner, Role.StoreStaff, Role.SuperAdmin, Role.Admin)
  @Post()
  add(@Body() dto: CreateKhataEntryDto, @CurrentUser() user: AuthUser) {
    return this.khata.add(dto, user);
  }

  @Roles(Role.StoreOwner, Role.StoreStaff, Role.SuperAdmin, Role.Admin)
  @Get('store/:storeId/summary')
  summary(@Param('storeId') storeId: string, @CurrentUser() user: AuthUser) {
    return this.khata.summary(storeId, user);
  }

  @Roles(Role.StoreOwner, Role.StoreStaff, Role.SuperAdmin, Role.Admin)
  @Get('store/:storeId/customers')
  customers(@Param('storeId') storeId: string, @CurrentUser() user: AuthUser) {
    return this.khata.customers(storeId, user);
  }

  @Roles(Role.StoreOwner, Role.StoreStaff, Role.SuperAdmin, Role.Admin)
  @Get('store/:storeId/customer/:phone')
  ledger(
    @Param('storeId') storeId: string,
    @Param('phone') phone: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.khata.customerLedger(storeId, phone, user);
  }

  @Roles(Role.StoreOwner, Role.StoreStaff, Role.SuperAdmin, Role.Admin)
  @Get('store/:storeId')
  entries(
    @Param('storeId') storeId: string,
    @CurrentUser() user: AuthUser,
    @Query('phone') phone?: string,
  ) {
    return this.khata.entries(storeId, user, phone);
  }

  @Roles(Role.StoreOwner, Role.SuperAdmin, Role.Admin)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.khata.remove(id, user);
  }
}
