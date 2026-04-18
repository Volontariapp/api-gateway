import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetEventParticipantsQuery } from '@volontariapp/contracts-nest';
import { GetEventParticipantsWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../../common/pagination.dto.js';

export class GetEventParticipantsRequestDTO implements GetEventParticipantsWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  eventId!: string;

  toQuery(): GetEventParticipantsQuery {
    return {
      eventId: this.eventId,
      pagination: this.pagination,
    };
  }
}
