import { GetMyFollowsQuery } from '@volontariapp/contracts-nest';
import { GetMyFollowsWebRequest } from '@volontariapp/contracts';
import { NestedPagination, PaginationRequestDTO } from '../../../../common/pagination/index.js';

export class GetMyFollowsRequestDTO implements GetMyFollowsWebRequest {
  @NestedPagination(PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetMyFollowsQuery {
    return { pagination: this.pagination };
  }
}
