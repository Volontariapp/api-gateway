import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetMyFollowersQuery } from '@volontariapp/contracts-nest';
import { GetMyFollowersWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetMyFollowersRequestDTO implements GetMyFollowersWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  userId!: string;

  toQuery(): GetMyFollowersQuery {
    return {
      userId: this.userId,
      pagination: this.pagination,
    };
  }
}
