import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetEventPostsQuery } from '@volontariapp/contracts-nest';
import { GetEventPostsWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetEventPostsRequestDTO implements GetEventPostsWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  eventId!: string;

  toQuery(): GetEventPostsQuery {
    return {
      eventId: this.eventId,
      pagination: this.pagination,
    };
  }
}
