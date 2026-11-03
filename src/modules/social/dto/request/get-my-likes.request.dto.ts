import { GetUserLikesQuery } from '@volontariapp/contracts-nest';
import { GetUserLikesWebRequest } from '@volontariapp/contracts';
import {
  LegacyPaginationRequestDTO,
  NestedPagination,
} from '../../../../common/pagination/index.js';

/** GET /social/likes : l'ancienne app charge tous ses likes d'un coup avec limit=500 (plafond legacy). */
export class GetMyLikesRequestDTO implements GetUserLikesWebRequest {
  @NestedPagination(LegacyPaginationRequestDTO)
  pagination?: LegacyPaginationRequestDTO;

  toQuery(): GetUserLikesQuery {
    return {
      pagination: this.pagination,
    };
  }
}
