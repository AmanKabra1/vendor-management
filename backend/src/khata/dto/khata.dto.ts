import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { KhataEntryType } from '../khata.entity';

export class CreateKhataEntryDto {
  @IsMongoId()
  store: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsEnum(KhataEntryType)
  type: KhataEntryType;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsMongoId()
  order?: string;

  @IsOptional()
  @IsDateString()
  at?: string;
}
