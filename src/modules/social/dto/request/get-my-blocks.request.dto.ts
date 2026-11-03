import { GetMyBlocksQuery } from '@volontariapp/contracts-nest';
import { GetMyBlocksWebRequest } from '@volontariapp/contracts';
import { NestedPagination, PaginationRequestDTO } from '../../../../common/pagination/index.js';

export class GetMyBlocksRequestDTO implements GetMyBlocksWebRequest {
  @NestedPagination(PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetMyBlocksQuery {
    return { pagination: this.pagination };
  }
}
