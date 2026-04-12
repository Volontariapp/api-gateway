import { ApiProperty } from '@nestjs/swagger';
import { PaginationRequest } from '@volontariapp/contracts';

export class PaginationDTO implements PaginationRequest {
  @ApiProperty({ example: 10, required: false })
  limit!: number;

  @ApiProperty({ example: 0, required: false })
  page!: number;

  toQuery(): PaginationRequest {
    return {
      limit: this.limit,
      page: this.page,
    };
  }
}
