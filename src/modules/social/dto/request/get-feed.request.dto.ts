import { GetFeedQuery } from '@volontariapp/contracts-nest';
import { GetFeedWebRequest } from '@volontariapp/contracts';
import { NestedPagination, PaginationRequestDTO } from '../../../../common/pagination/index.js';

export class GetFeedRequestDTO implements GetFeedWebRequest {
  @NestedPagination(PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetFeedQuery {
    return {
      pagination: this.pagination,
    };
  }
}
