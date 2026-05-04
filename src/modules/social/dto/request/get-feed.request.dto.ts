import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetFeedQuery } from '@volontariapp/contracts-nest';
import { GetFeedWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetFeedRequestDTO implements GetFeedWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetFeedQuery {
    return {
      pagination: this.pagination,
    };
  }
}
