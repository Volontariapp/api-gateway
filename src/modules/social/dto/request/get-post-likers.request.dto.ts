import { GetPostLikersQuery } from '@volontariapp/contracts-nest';
import { GetPostLikersWebRequest } from '@volontariapp/contracts';
import { NestedPagination, PaginationRequestDTO } from '../../../../common/pagination/index.js';

export class GetPostLikersRequestDTO implements GetPostLikersWebRequest {
  @NestedPagination(PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  postId!: string;

  toQuery(): GetPostLikersQuery {
    return {
      postId: this.postId,
      pagination: this.pagination,
    };
  }
}
