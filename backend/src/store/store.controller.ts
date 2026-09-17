import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { StoreService, StoreQuery } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto, RejectStoreDto } from './dto/update-store.dto';
import { StoreStatus } from './store.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

/** A raw query string bag: every value arrives as a string or not at all. */
export type RawQuery = Record<string, string | undefined>;

/** Turns loose query strings ("1", "true", "yes") into the service's filters. */
export function toStoreQuery(q: RawQuery): StoreQuery {
  const flag = (v: string | undefined) =>
    v === '1' || v === 'true' || v === 'yes';
  return {
    category: q.category,
    categories: q.categories,
    essential: flag(q.essential),
    emergency: flag(q.emergency),
    open: flag(q.open),
    udhaar: flag(q.udhaar),
    is24x7: flag(q.is24x7),
    pincode: q.pincode,
    area: q.area,
    city: q.city,
    q: q.q,
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // Declared before ':id' so "nearby" isn't captured as an id.
  @Get('nearby')
  nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string | undefined,
    @Query() query: RawQuery,
  ) {
    if (lat == null || lng == null) {
      throw new BadRequestException('lat and lng are required');
    }
    return this.storeService.nearby(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : undefined,
      toStoreQuery(query),
    );
  }

  /** Shops this field sales agent onboarded (commission view). */
  @Roles(Role.Sales, Role.SuperAdmin, Role.Admin)
  @Get('onboarded')
  onboarded(@CurrentUser() user: AuthUser) {
    return this.storeService.onboardedBy(user.userId);
  }

  @Roles(
    Role.StoreOwner,
    Role.Vendor,
    Role.ServiceProvider,
    Role.SuperAdmin,
    Role.Admin,
  )
  @Post()
  create(@Body() dto: CreateStoreDto, @CurrentUser() user: AuthUser) {
    return this.storeService.create(dto, user.userId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.storeService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.storeService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.storeService.update(id, dto, user);
  }

  /** Shutter switch: pause/resume today's orders without going offline. */
  @Patch(':id/shutter')
  shutter(
    @Param('id') id: string,
    @Body('closed') closed: boolean,
    @CurrentUser() user: AuthUser,
  ) {
    return this.storeService.setShutter(id, !!closed, user);
  }

  /** Publish the shop's rate list (the small-shop answer to an SKU catalog). */
  @Put(':id/price-list')
  priceList(
    @Param('id') id: string,
    @Body('items') items: Record<string, any>[],
    @CurrentUser() user: AuthUser,
  ) {
    return this.storeService.setPriceList(id, items || [], user);
  }

  // --- counter staff: extra logins for the people who actually run the shop ---

  @Get(':id/staff')
  staff(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.storeService.staff(id, user);
  }

  @Roles(Role.StoreOwner, Role.SuperAdmin, Role.Admin)
  @Post(':id/staff')
  addStaff(
    @Param('id') id: string,
    @Body('identifier') identifier: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.storeService.addStaff(id, identifier, user);
  }

  @Roles(Role.StoreOwner, Role.SuperAdmin, Role.Admin)
  @Delete(':id/staff/:staffId')
  removeStaff(
    @Param('id') id: string,
    @Param('staffId') staffId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.storeService.removeStaff(id, staffId, user);
  }

  @Roles(Role.SuperAdmin, Role.Admin)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.storeService.setStatus(id, StoreStatus.Approved);
  }

  @Roles(Role.SuperAdmin, Role.Admin)
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectStoreDto) {
    return this.storeService.setStatus(id, StoreStatus.Rejected, dto?.reason);
  }

  /** Admin removes a shop entirely. */
  @Roles(Role.SuperAdmin, Role.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storeService.remove(id);
  }
}
