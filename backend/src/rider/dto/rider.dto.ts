import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  Availability,
  DeliveryPlatform,
  RiderDocType,
  VehicleType,
} from '../rider.entity';

export class RegisterRiderDto {
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsArray()
  preferredPlatforms?: DeliveryPlatform[];

  @IsOptional()
  @IsArray()
  workingZones?: Record<string, string>[];
}

export class UpdateRiderDto extends RegisterRiderDto {
  @IsOptional()
  bankDetails?: Record<string, string>;
}

export class AvailabilityDto {
  @IsEnum(Availability)
  availability: Availability;
}

export class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class TimeSlotsDto {
  @IsArray()
  timeSlots: Record<string, any>[];
}

export class VerifyDocumentDto {
  @IsEnum(RiderDocType)
  type: RiderDocType;
}
