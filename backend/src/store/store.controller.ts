import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto, RejectStoreDto } from './dto/update-store.dto';
import { StoreStatus } from './store.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // Declared before ':id' so "nearby" isn't captured as an id.
  @Get('nearby')
  nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    if (lat == null || lng == null) {
      throw new BadRequestException('lat and lng are required');
    }
    return this.storeService.nearby(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : undefined,
    );
  }

  @Roles(Role.StoreOwner, Role.Vendor, Role.SuperAdmin, Role.Admin)
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
}
