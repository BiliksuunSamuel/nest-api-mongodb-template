import { ApiProperty } from '@nestjs/swagger';

export class BaseFilter {
  @ApiProperty({ required: false, default: 1 })
  page: number;

  @ApiProperty({ required: false })
  query: string;

  @ApiProperty({ required: false, default: 10 })
  pageSize: number;
}
