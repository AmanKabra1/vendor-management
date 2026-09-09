import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateLanguageDto, UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../auth/current-user.decorator';

/**
 * The signed-in user's own account. Split from /users (which is admin-only)
 * so anyone can fix their own phone number, save their landmark address, or
 * switch the app to Hindi without an admin.
 */
@UseGuards(JwtAuthGuard)
@Controller('me')
export class ProfileController {
  constructor(private readonly users: UserService) {}

  @Get()
  async me(@CurrentUser() user: AuthUser) {
    const account = await this.users.findById(user.userId);
    if (!account) return null;
    return {
      id: String(account._id),
      name: account.name,
      email: account.email,
      role: account.role,
      phone: account.phone,
      landline: account.landline,
      isApproved: account.isApproved,
      isVerified: account.isVerified,
      preferredLanguage: account.preferredLanguage || 'en',
      storeId: account.store ? String(account.store) : null,
      address: account.address,
    };
  }

  /**
   * Language switch — its own endpoint so the toggle is one tiny request.
   * Declared before the bare @Patch() so 'language' isn't swallowed by it.
   */
  @Patch('language')
  language(@CurrentUser() user: AuthUser, @Body() dto: UpdateLanguageDto) {
    return this.users.updateProfile(user.userId, {
      preferredLanguage: dto.preferredLanguage,
    });
  }

  /** Name, contact, saved address (with landmark + mohalla), language. */
  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.userId, dto);
  }
}
