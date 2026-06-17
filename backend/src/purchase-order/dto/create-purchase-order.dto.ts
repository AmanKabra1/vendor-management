import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
} from 'class-validator';

export class CreatePurchaseOrderDto {
    @ApiProperty({ description: 'Purchase Order Number' })
  @IsString()
  poNumber: string;

  @ApiProperty({ description: 'Vendor ID' })
  @IsNumber()
  vendor: number;

  @ApiProperty({ description: 'Order Date' })
  @IsDateString()
  orderDate: string;

  @ApiProperty({ description: 'Issue Date' })
  @IsDateString()
  issueDate: string;

  @ApiProperty({ description: 'Delivery Date', required: false })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiProperty({ description: 'Items in the purchase order' })
  @IsObject()
  items: object;

  @ApiProperty({ description: 'Quantity of items' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Status of the purchase order' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Quality rating (0-5)', required: false })
  @IsOptional()
  @IsNumber()
  qualityRating?: number;
}
