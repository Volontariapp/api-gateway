import { GetEventPostsQuery } from '@volontariapp/contracts-nest';
import { GetEventPostsWebRequest } from '@volontariapp/contracts';
import { NestedPagination, PaginationRequestDTO } from '../../../../common/pagination/index.js';

export class GetEventPostsRequestDTO implements GetEventPostsWebRequest {
  @NestedPagination(PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  eventId!: string;

  toQuery(): GetEventPostsQuery {
    return {
      eventId: this.eventId,
      pagination: this.pagination,
    };
  }
}
