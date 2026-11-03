import type { GetUserWishEventQuery } from '@volontariapp/contracts-nest';
import type { GetUserWishEventWebRequest } from '@volontariapp/contracts';
import { FlatPaginationQueryDTO } from '../../../../common/pagination/index.js';

export class GetUserWishesRequestDTO
  extends FlatPaginationQueryDTO
  implements GetUserWishEventWebRequest
{
  toQuery(): GetUserWishEventQuery {
    return { pagination: this.pagination };
  }
}
