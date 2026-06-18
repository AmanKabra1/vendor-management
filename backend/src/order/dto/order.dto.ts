import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { OrderPriority, PaymentMethod } from '../order.entity';

export class CreateOrderDto {
  @IsMongoId()
  store: string;

  @IsObject()
  customer: Record<string, any>; // { name, phone, address, lat, lng }

  @IsOptional()
  @IsArray()
  items?: Record<string, any>[]; // [{ name, quantity, price, weight }]

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsNumber()
  deliveryFee?: number;

  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  // Kirana customer flow: typed list and/or photo of a handwritten list.
  @IsOptional()
  @IsString()
  listText?: string;

  @IsOptional()
  @IsString()
  listImageUrl?: string;
}

export class AssignRiderDto {
  @IsMongoId()
  riderId: string;
}

export class DeliverDto {
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class CancelOrderDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
