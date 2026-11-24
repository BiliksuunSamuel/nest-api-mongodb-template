import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { CountryCode } from 'libphonenumber-js';
import configuration from 'src/configuration';

export class LoginRequest {
  @ApiProperty({
    description:
      'Phone number, international or local to DEFAULT_COUNTRY (e.g. 0241234567)',
  })
  @IsNotEmpty()
  @IsPhoneNumber(configuration().defaultCountry as CountryCode)
  phoneNumber: string;
}
