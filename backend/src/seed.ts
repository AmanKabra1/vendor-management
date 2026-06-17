import { INestApplicationContext } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserService } from './user/user.service';
import { Role } from './auth/role.enum';

/**
 * Seeds a default admin account on first boot so there's always a way in.
 * Credentials can be overridden via ADMIN_EMAIL / ADMIN_PASSWORD env vars.
 */
export async function seedAdmin(app: INestApplicationContext) {
  const userService = app.get(UserService);

  const email = process.env.ADMIN_EMAIL || 'admin@vendor.com';
  const existing = await userService.findByEmail(email);
  if (existing) return;

  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(password, 10);
  await userService.create({
    email,
    password: hash,
    name: 'Administrator',
    role: Role.Admin,
    isVerified: true,
    isApproved: true,
    vendor: null,
  });

  // eslint-disable-next-line no-console
  console.log(`👤 Seeded admin account: ${email} / ${password}`);
}
