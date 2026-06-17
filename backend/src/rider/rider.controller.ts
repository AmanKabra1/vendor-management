import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { RiderService } from './rider.service';
import {
  RegisterRiderDto,
  UpdateRiderDto,
  AvailabilityDto,
  LocationDto,
  TimeSlotsDto,
  VerifyDocumentDto,
} from './dto/rider.dto';
import { Availability } from './rider.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('riders')
export class RiderController {
  constructor(private readonly riderService: RiderService) {}

  // Declared before ':id' so "nearby" isn't captured as an id.
  @Roles(Role.StoreOwner, Role.Vendor, Role.SuperAdmin, Role.Admin)
  @Get('nearby')
  nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
    @Query('status') status?: Availability,
  ) {
    if (lat == null || lng == null) {
      throw new BadRequestException('lat and lng are required');
    }
    return this.riderService.nearby(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : undefined,
      status || Availability.Available,
    );
  }

  @Roles(Role.Rider)
  @Post('register')
  register(@Body() dto: RegisterRiderDto, @CurrentUser() user: AuthUser) {
    return this.riderService.register(dto as any, user.userId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.riderService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.riderService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRiderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.riderService.update(id, dto as any, user);
  }

  @Patch(':id/availability')
  setAvailability(
    @Param('id') id: string,
    @Body() dto: AvailabilityDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.riderService.setAvailability(id, dto.availability, user);
  }

  @Patch(':id/location')
  setLocation(
    @Param('id') id: string,
    @Body() dto: LocationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.riderService.setLocation(id, dto.lat, dto.lng, user);
  }

  @Get(':id/time-slots')
  getTimeSlots(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.riderService.getTimeSlots(id, user);
  }

  @Put(':id/time-slots')
  setTimeSlots(
    @Param('id') id: string,
    @Body() dto: TimeSlotsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.riderService.setTimeSlots(id, dto.timeSlots, user);
  }

  @Roles(Role.SuperAdmin, Role.Admin)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.riderService.approve(id);
  }

  @Roles(Role.SuperAdmin, Role.Admin)
  @Patch(':id/verify-document')
  verifyDocument(@Param('id') id: string, @Body() dto: VerifyDocumentDto) {
    return this.riderService.verifyDocument(id, dto.type);
  }
}
