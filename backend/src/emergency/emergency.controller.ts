import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmergencyService } from './emergency.service';
import {
  CreateEmergencyContactDto,
  CreateSosDto,
  RespondSosDto,
  UpdateEmergencyContactDto,
} from './dto/emergency.dto';
import { SosStatus } from './emergency.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergency: EmergencyService) {}

  // ------------------------------------------------------------------- SOS
  // Declared before the contact routes so "sos" is never read as an id.

  /** Raise a help request. Login required — an open endpoint invites hoaxes. */
  @Post('sos')
  raise(@Body() dto: CreateSosDto, @CurrentUser() user: AuthUser) {
    return this.emergency.raiseSos(dto, user);
  }

  /** Open alerts a responder can act on; pass lat/lng to see only nearby ones. */
  @Roles(
    Role.SuperAdmin,
    Role.Admin,
    Role.Rider,
    Role.StoreOwner,
    Role.StoreStaff,
    Role.ServiceProvider,
  )
  @Get('sos')
  alerts(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    if (lat && lng)
      return this.emergency.nearbyAlerts(Number(lat), Number(lng));
    return this.emergency.openAlerts();
  }

  @Get('sos/mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.emergency.myAlerts(user);
  }

  @Roles(
    Role.SuperAdmin,
    Role.Admin,
    Role.Rider,
    Role.StoreOwner,
    Role.StoreStaff,
    Role.ServiceProvider,
  )
  @Patch('sos/:id/acknowledge')
  acknowledge(
    @Param('id') id: string,
    @Body() dto: RespondSosDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.emergency.setSosStatus(
      id,
      SosStatus.Acknowledged,
      user,
      dto?.note,
    );
  }

  @Patch('sos/:id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() dto: RespondSosDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.emergency.setSosStatus(id, SosStatus.Resolved, user, dto?.note);
  }

  @Patch('sos/:id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.emergency.setSosStatus(id, SosStatus.Cancelled, user);
  }

  // -------------------------------------------------------- local contacts

  @Get()
  findAll(@Query() query: Record<string, any>) {
    return this.emergency.findAll(query);
  }

  /**
   * Admins add numbers directly. Shopkeepers and field sales agents can submit
   * one too — they know the town — but it lands unverified until an admin
   * confirms it, so a wrong number never sits at the top of the list.
   */
  @Roles(
    Role.SuperAdmin,
    Role.Admin,
    Role.StoreOwner,
    Role.Sales,
    Role.ServiceProvider,
  )
  @Post()
  create(
    @Body() dto: CreateEmergencyContactDto,
    @CurrentUser() user: AuthUser,
  ) {
    const isAdmin = user.role === Role.SuperAdmin || user.role === Role.Admin;
    return this.emergency.create(
      { ...dto, verified: isAdmin ? (dto.verified ?? true) : false },
      user,
    );
  }

  @Roles(Role.SuperAdmin, Role.Admin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmergencyContactDto) {
    return this.emergency.update(id, dto);
  }

  @Roles(Role.SuperAdmin, Role.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emergency.remove(id);
  }
}
