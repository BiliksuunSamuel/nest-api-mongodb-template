import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OtpVerificationRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  verificationCode: string;
}
