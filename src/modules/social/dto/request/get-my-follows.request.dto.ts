import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetMyFollowsQuery } from '@volontariapp/contracts-nest';
import { GetMyFollowsWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetMyFollowsRequestDTO implements GetMyFollowsWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetMyFollowsQuery {
    return { pagination: this.pagination };
  }
}
