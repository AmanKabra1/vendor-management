import { Controller, Get, Query } from '@nestjs/common';
import { EmergencyService } from './emergency.service';

/**
 * Public, no auth. An emergency screen behind a login is worthless — this has
 * to work for a stranger holding a borrowed phone.
 */
@Controller('public/emergency')
export class PublicEmergencyController {
  constructor(private readonly emergency: EmergencyService) {}

  @Get('counts')
  counts() {
    return this.emergency.typeCounts();
  }

  @Get('nearby')
  nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string | undefined,
    @Query() query: Record<string, any>,
  ) {
    if (!lat || !lng) return this.emergency.directory(query);
    return this.emergency.nearby(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : undefined,
      query,
    );
  }

  /** National helplines + local numbers + safety steps, in one response. */
  @Get()
  directory(@Query() query: Record<string, any>) {
    return this.emergency.directory(query);
  }
}
