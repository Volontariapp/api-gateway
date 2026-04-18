import { ApiProperty } from '@nestjs/swagger';
import { PaginationRequest } from '@volontariapp/contracts';

export class PaginationRequestDTO implements PaginationRequest {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;
}
