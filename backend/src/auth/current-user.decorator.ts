import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from './role.enum';

export interface AuthUser {
  userId: string;
  email: string;
  // Typed as the enum, not a bare string, so `user.role === Role.X` checks are
  // verified by the compiler instead of silently comparing unrelated values.
  role: Role;
  vendorId: string | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthUser = request.user;
    return data ? user?.[data] : user;
  },
);
