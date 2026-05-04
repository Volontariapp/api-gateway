import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetMyBlocksQuery } from '@volontariapp/contracts-nest';
import { GetMyBlocksWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetMyBlocksRequestDTO implements GetMyBlocksWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetMyBlocksQuery {
    return { pagination: this.pagination };
  }
}
