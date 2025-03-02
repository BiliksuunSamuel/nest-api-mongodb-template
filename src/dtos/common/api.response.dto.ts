import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty()
  data?: T;

  @ApiProperty()
  code: number;

  @ApiProperty()
  message?: string;
}
