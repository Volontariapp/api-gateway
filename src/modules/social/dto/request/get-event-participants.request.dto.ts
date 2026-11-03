import { GetEventParticipantsQuery } from '@volontariapp/contracts-nest';
import { GetEventParticipantsWebRequest } from '@volontariapp/contracts';
import { NestedPagination, PaginationRequestDTO } from '../../../../common/pagination/index.js';

export class GetEventParticipantsRequestDTO implements GetEventParticipantsWebRequest {
  @NestedPagination(PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  eventId!: string;

  toQuery(): GetEventParticipantsQuery {
    return {
      eventId: this.eventId,
      pagination: this.pagination,
    };
  }
}
