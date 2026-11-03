import { GetMyFollowersQuery } from '@volontariapp/contracts-nest';
import { GetMyFollowersWebRequest } from '@volontariapp/contracts';
import { NestedPagination, PaginationRequestDTO } from '../../../../common/pagination/index.js';

export class GetMyFollowersRequestDTO implements GetMyFollowersWebRequest {
  @NestedPagination(PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetMyFollowersQuery {
    return { pagination: this.pagination };
  }
}
