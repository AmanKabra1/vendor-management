import {
  IsArray,
  IsBoolean,
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

  // Shop name in the local script (हिंदी / मराठी …).
  @IsOptional()
  @IsString()
  nameLocal?: string;

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

  @IsOptional()
  @IsString()
  whatsapp?: string;

  // { street, city, state, pincode, landmark, area }
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

  @IsOptional()
  @IsBoolean()
  is24x7?: boolean;

  @IsOptional()
  @IsBoolean()
  closedToday?: boolean;

  @IsOptional()
  @IsBoolean()
  homeDelivery?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsUdhaar?: boolean;

  @IsOptional()
  @IsBoolean()
  emergencyService?: boolean;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsNumber()
  deliveryRadiusKm?: number;

  @IsOptional()
  @IsNumber()
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  deliveryChargeFlat?: number;

  @IsOptional()
  @IsArray()
  serviceAreas?: string[];

  // [{ name, nameLocal, price, unit, available }]
  @IsOptional()
  @IsArray()
  priceList?: Record<string, any>[];
}
