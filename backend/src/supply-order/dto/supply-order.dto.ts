import {
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateSupplyOrderDto {
  @IsMongoId()
  seller: string;

  // [{ product, name, unit, price, quantity }]
  @IsArray()
  @ArrayNotEmpty()
  items: Record<string, any>[];

  @IsOptional()
  @IsString()
  note?: string;
}
