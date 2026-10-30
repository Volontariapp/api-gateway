import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetEventAttendeesQuery } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetEventAttendeesRequestDTO implements Partial<GetEventAttendeesQuery> {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  eventId!: string;

  toQuery(): GetEventAttendeesQuery {
    return {
      eventId: this.eventId,
      pagination: this.pagination,
    };
  }
}
