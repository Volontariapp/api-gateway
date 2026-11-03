import { GetWhoBlockedMeQuery } from '@volontariapp/contracts-nest';
import { GetWhoBlockedMeWebRequest } from '@volontariapp/contracts';
import { NestedPagination, PaginationRequestDTO } from '../../../../common/pagination/index.js';

export class GetWhoBlockedMeRequestDTO implements GetWhoBlockedMeWebRequest {
  @NestedPagination(PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetWhoBlockedMeQuery {
    return { pagination: this.pagination };
  }
}
