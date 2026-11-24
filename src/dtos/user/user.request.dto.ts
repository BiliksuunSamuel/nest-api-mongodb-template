import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UserRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;
}
