import { ApiProperty } from '@nestjs/swagger';

export class PagedResults<T> {
  @ApiProperty()
  results: T[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
}
