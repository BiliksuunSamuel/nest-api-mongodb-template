import { ApiProperty } from '@nestjs/swagger';
import { BaseSchema } from 'src/schemas';

export class UserResponse extends BaseSchema {
  @ApiProperty()
  name: string;
  @ApiProperty()
  phoneNumber: string;
  @ApiProperty()
  role: string;
  @ApiProperty()
  authenticated: boolean;
}
