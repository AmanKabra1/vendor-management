import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * What a user may change about their own account.
 *
 * Deliberately narrow: `role`, `isApproved` and `isVerified` are absent, so a
 * PATCH /me can never be used to self-promote. The global ValidationPipe runs
 * with `whitelist: true`, so anything else posted is stripped before it
 * reaches the service (which allow-lists again).
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  landline?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsIn(['en', 'hi', 'mr'])
  preferredLanguage?: string;

  // { street, city, state, pincode, landmark, area, coordinates }
  @IsOptional()
  @IsObject()
  address?: Record<string, unknown>;
}

export class UpdateLanguageDto {
  @IsIn(['en', 'hi', 'mr'])
  preferredLanguage: string;
}
