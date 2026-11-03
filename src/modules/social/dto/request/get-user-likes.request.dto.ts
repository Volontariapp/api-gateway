import { GetUserLikesQuery } from '@volontariapp/contracts-nest';
import { GetUserLikesWebRequest } from '@volontariapp/contracts';
import { NestedPagination, PaginationRequestDTO } from '../../../../common/pagination/index.js';

export class GetUserLikesRequestDTO implements GetUserLikesWebRequest {
  @NestedPagination(PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetUserLikesQuery {
    return {
      pagination: this.pagination,
    };
  }
}
