import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@volontariapp/contracts';

export class PaginationResponseDTO implements PaginationResponse {
  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 10 })
  totalPages!: number;
}
