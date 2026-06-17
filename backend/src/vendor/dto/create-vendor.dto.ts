import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateVendorDto {
    @ApiProperty({ description: 'Name of the vendor' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Contact details of the vendor' })
  @IsString()
  contactDetails: string;

  @ApiProperty({ description: 'Address of the vendor' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Unique code for the vendor' })
  @IsString()
  @Length(3, 10)
  vendorCode: string;
}
