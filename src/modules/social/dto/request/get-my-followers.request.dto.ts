import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetMyFollowersQuery } from '@volontariapp/contracts-nest';
import { GetMyFollowersWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetMyFollowersRequestDTO implements GetMyFollowersWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetMyFollowersQuery {
    return { pagination: this.pagination };
  }
}
