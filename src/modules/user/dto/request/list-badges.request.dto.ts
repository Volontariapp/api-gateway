import { ListBadgesRequest } from '@volontariapp/contracts';
import { ListBadgesQuery } from '@volontariapp/contracts-nest';
import { NestedPagination, PaginationRequestDTO } from '../../../../common/pagination/index.js';

export class ListBadgesRequestDTO implements ListBadgesRequest {
  @NestedPagination(PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): ListBadgesQuery {
    return {
      pagination: this.pagination
        ? { limit: this.pagination.limit, page: this.pagination.page }
        : undefined,
    };
  }
}
