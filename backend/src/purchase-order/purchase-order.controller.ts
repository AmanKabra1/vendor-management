// src/purchase-order/purchase-order.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly poService: PurchaseOrderService) {}

  @Roles(Role.Admin)
  @Post()
  create(@Body() data: CreatePurchaseOrderDto) {
    return this.poService.create(data);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('vendorId') vendorId?: number,
  ) {
    // Vendor users are locked to their own purchase orders.
    if (user.role === Role.Vendor) {
      return this.poService.findAll(user.vendorId ?? -1);
    }
    return this.poService.findAll(vendorId);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @CurrentUser() user: AuthUser) {
    const po = await this.poService.findOne(id);
    if (!po) throw new NotFoundException();
    this.assertOwnership(user, po);
    return po;
  }

  @Roles(Role.Admin)
  @Put(':id')
  update(@Param('id') id: number, @Body() data: any) {
    return this.poService.update(id, data);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.poService.delete(id);
  }

  // Acknowledgment is the vendor's action (admins may also do it).
  @Post(':id/acknowledge')
  async acknowledge(@Param('id') id: number, @CurrentUser() user: AuthUser) {
    const po = await this.poService.findOne(id);
    if (!po) throw new NotFoundException();
    this.assertOwnership(user, po);
    return this.poService.acknowledge(id);
  }

  private assertOwnership(user: AuthUser, po: any) {
    if (user.role === Role.Admin) return;
    if (!po.vendor || po.vendor.id !== user.vendorId) {
      throw new ForbiddenException('Not your purchase order');
    }
  }
}
