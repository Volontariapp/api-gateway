import type { GetUserEventQuery } from '@volontariapp/contracts-nest';
import type { GetUserEventWebRequest } from '@volontariapp/contracts';
import { FlatPaginationQueryDTO } from '../../../../common/pagination/index.js';

export class GetUserEventsRequestDTO
  extends FlatPaginationQueryDTO
  implements GetUserEventWebRequest
{
  toQuery(): GetUserEventQuery {
    return { pagination: this.pagination };
  }
}
