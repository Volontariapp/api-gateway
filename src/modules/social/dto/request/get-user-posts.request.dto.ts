import { GetUserPostsQuery } from '@volontariapp/contracts-nest';
import { GetUserPostsWebRequest } from '@volontariapp/contracts';
import { NestedPagination, PaginationRequestDTO } from '../../../../common/pagination/index.js';

export class GetUserPostsRequestDTO implements GetUserPostsWebRequest {
  @NestedPagination(PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetUserPostsQuery {
    return { pagination: this.pagination };
  }
}
