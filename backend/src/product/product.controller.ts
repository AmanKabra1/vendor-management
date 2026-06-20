import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Buyers list available suppliers.
  @Get('suppliers')
  suppliers() {
    return this.productService.listSuppliers();
  }

  // Browse a supplier's active catalog.
  @Get('by-seller/:sellerId')
  bySeller(@Param('sellerId') sellerId: string) {
    return this.productService.findBySeller(sellerId);
  }

  // Supplier's own catalog.
  @Roles(Role.Wholesaler, Role.Distributor, Role.SuperAdmin, Role.Admin)
  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.productService.findMine(user);
  }

  @Roles(Role.Wholesaler, Role.Distributor)
  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthUser) {
    return this.productService.create(dto, user.userId);
  }

  @Roles(Role.Wholesaler, Role.Distributor)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: AuthUser) {
    return this.productService.update(id, dto, user);
  }

  @Roles(Role.Wholesaler, Role.Distributor)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.productService.remove(id, user);
  }
}
