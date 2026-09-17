import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, SUPPLIER_ROLES } from '../auth/role.enum';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';
import { NotificationService } from '../notification/notification.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SuperAdmin, Role.Admin)
@Controller('users')
export class UserController {
  constructor(
    private readonly users: UserService,
    private readonly notifications: NotificationService,
  ) {}

  /** All accounts, for the admin "Users" tab (any role, newest first). */
  @Get()
  all() {
    return this.users.findAllForAdmin();
  }

  /** Wholesalers & distributors for the admin "Suppliers" tab. */
  @Get('suppliers')
  suppliers() {
    return this.users.findSuppliersForAdmin(SUPPLIER_ROLES);
  }

  /** Admin removes any non-admin account. */
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    const res = await this.users.remove(id, actor.userId);
    if (res.notFound) throw new NotFoundException('User not found');
    if (!res.ok) throw new BadRequestException(res.reason);
    return res;
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
