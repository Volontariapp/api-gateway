import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetUserLikesQuery } from '@volontariapp/contracts-nest';
import { GetUserLikesWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetUserLikesRequestDTO implements GetUserLikesWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetUserLikesQuery {
    return {
      pagination: this.pagination,
    };
  }
}
