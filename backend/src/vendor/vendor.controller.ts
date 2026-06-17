// src/vendor/vendor.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { VendorService } from './vendor.service';
import { Vendor } from './vendor.entity';
import { PerformanceService } from 'src/performance/performance.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendors')
export class VendorController {
  constructor(
    private readonly vendorService: VendorService,
    private readonly performanceService: PerformanceService,
  ) {}

  /** A vendor user may only touch their own vendor record. Admins: anything. */
  private assertAccess(user: AuthUser, vendorId: string) {
    if (user.role === Role.Admin) return;
    if (user.vendorId !== vendorId) {
      throw new ForbiddenException('You can only access your own vendor data');
    }
  }

  @Roles(Role.Admin)
  @Post()
  create(@Body() data: CreateVendorDto) {
    return this.vendorService.create(data);
  }

  @Roles(Role.Admin)
  @Get()
  findAll() {
    return this.vendorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    this.assertAccess(user, id);
    return this.vendorService.findOne(id);
  }

  @Roles(Role.Admin)
  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Vendor>) {
    return this.vendorService.update(id, data);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vendorService.remove(id);
  }

  @Get(':id/performance')
  getPerformance(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    this.assertAccess(user, id);
    return this.vendorService.getPerformance(id);
  }

  @Get(':id/performance-history')
  getPerformanceHistory(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    this.assertAccess(user, id);
    return this.performanceService.getHistory(id);
  }
}
