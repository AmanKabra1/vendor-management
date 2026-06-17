import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../role.enum';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(4)
  password: string;

  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Self-registration role. Only StoreOwner / Rider / Customer are accepted;
  // anything else (or omitted) falls back to the legacy Vendor flow.
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  // Optional: link this account to an existing vendor by code.
  @IsOptional()
  vendorCode?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
