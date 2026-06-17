import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(4)
  password: string;

  @IsNotEmpty()
  name: string;

  // Optional: link this vendor account to an existing vendor by code.
  @IsOptional()
  vendorCode?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
