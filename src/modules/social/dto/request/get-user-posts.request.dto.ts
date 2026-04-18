import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetUserPostsQuery } from '@volontariapp/contracts-nest';
import { GetUserPostsWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetUserPostsRequestDTO implements GetUserPostsWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  userId!: string;

  toQuery(): GetUserPostsQuery {
    return {
      userId: this.userId,
      pagination: this.pagination,
    };
  }
}
