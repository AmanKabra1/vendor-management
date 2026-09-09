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
import { SalesService } from './sales.service';
import { CreateLeadDto, LogVisitDto, UpdateLeadDto } from './dto/lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

/** Field sales: the shop-by-shop pipeline that gets a town onto the platform. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Sales, Role.SuperAdmin, Role.Admin)
@Controller('sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.sales.stats(user);
  }

  @Get('leads')
  leads(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.sales.findAll(user, status);
  }

  @Post('leads')
  create(@Body() dto: CreateLeadDto, @CurrentUser() user: AuthUser) {
    return this.sales.create(dto, user);
  }

  @Patch('leads/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.sales.update(id, dto, user);
  }

  @Post('leads/:id/visit')
  visit(
    @Param('id') id: string,
    @Body() dto: LogVisitDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.sales.logVisit(id, dto, user);
  }

  @Patch('leads/:id/store')
  attach(
    @Param('id') id: string,
    @Body('storeId') storeId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.sales.attachStore(id, storeId, user);
  }

  @Delete('leads/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.sales.remove(id, user);
  }
}
