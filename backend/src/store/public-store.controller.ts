import { Controller, Get, Param, Query } from '@nestjs/common';
import { StoreService } from './store.service';
import { RawQuery, toStoreQuery } from './store.controller';

/**
 * Public shop directory — deliberately no auth.
 *
 * In a town or kasba the first thing someone needs is a phone number: which
 * medical shop is open at 11pm, who delivers a water can, which gas agency
 * takes refill bookings. Making that require a signup would make the app
 * useless in exactly the moment it matters, so the directory is open and the
 * account is only needed to place a tracked order.
 */
@Controller('public/shops')
export class PublicStoreController {
  constructor(private readonly storeService: StoreService) {}

  /** Live shops per category, for the directory tiles. */
  @Get('counts')
  counts(@Query() query: RawQuery) {
    return this.storeService.categoryCounts(toStoreQuery(query));
  }

  /** Categories that actually have a live shop in them. */
  @Get('categories')
  categories() {
    return this.storeService.liveCategories();
  }

  /** Nearest shops to a point, with the same filters as the logged-in view. */
  @Get('nearby')
  nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string | undefined,
    @Query() query: RawQuery,
  ) {
    if (!lat || !lng) return [];
    return this.storeService.nearby(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : 8000,
      toStoreQuery(query),
    );
  }

  /** Search by pincode, area name, shop type or item — no coordinates needed. */
  @Get()
  list(@Query() query: RawQuery) {
    return this.storeService.directory(toStoreQuery(query));
  }

  @Get(':id')
  one(@Param('id') id: string) {
    return this.storeService.publicOne(id);
  }
}
