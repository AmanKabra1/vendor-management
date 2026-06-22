import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, SUPPLIER_ROLES } from '../auth/role.enum';
import { NotificationService } from '../notification/notification.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SuperAdmin, Role.Admin)
@Controller('users')
export class UserController {
  constructor(
    private readonly users: UserService,
    private readonly notifications: NotificationService,
  ) {}

  /** Wholesalers & distributors for the admin "Suppliers" tab. */
  @Get('suppliers')
  suppliers() {
    return this.users.findSuppliersForAdmin(SUPPLIER_ROLES);
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string) {
    const user = await this.users.setApproval(id, true);
    if (!user) throw new NotFoundException('User not found');
    this.notifications.approved(user.email, user.name, `${user.role} account`);
    return user;
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: string, @Body('reason') reason?: string) {
    const user = await this.users.setApproval(id, false);
    if (!user) throw new NotFoundException('User not found');
    this.notifications.rejected(user.email, user.name, `${user.role} account`, reason);
    return user;
  }
}
