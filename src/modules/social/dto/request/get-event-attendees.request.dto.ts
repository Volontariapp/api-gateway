import { GetEventAttendeesQuery } from '@volontariapp/contracts';
import { NestedPagination, PaginationRequestDTO } from '../../../../common/pagination/index.js';

export class GetEventAttendeesRequestDTO implements Partial<GetEventAttendeesQuery> {
  @NestedPagination(PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  eventId!: string;

  toQuery(): GetEventAttendeesQuery {
    return {
      eventId: this.eventId,
      pagination: this.pagination,
    };
  }
}
