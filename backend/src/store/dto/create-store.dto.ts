import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { StoreCategory } from '../store.entity';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(StoreCategory)
  category?: StoreCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // { street, city, state, pincode, landmark }
  @IsOptional()
  @IsObject()
  address?: Record<string, string>;

  // Geo coordinates (decimal degrees). Stored as GeoJSON [lng, lat].
  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsObject()
  operatingHours?: Record<string, any>;
}
