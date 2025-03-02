import { ApiProperty } from '@nestjs/swagger';
import { UserRequest } from './user.request.dto';
import { IsNotEmpty, IsStrongPassword } from 'class-validator';

export class CreateUserRequest extends UserRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;
}
