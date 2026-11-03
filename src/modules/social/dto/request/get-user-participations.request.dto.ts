import type { GetUserParticipateEventQuery } from '@volontariapp/contracts-nest';
import type { GetUserParticipateEventWebRequest } from '@volontariapp/contracts';
import { FlatPaginationQueryDTO } from '../../../../common/pagination/index.js';

export class GetUserParticipationsRequestDTO
  extends FlatPaginationQueryDTO
  implements GetUserParticipateEventWebRequest
{
  toQuery(): GetUserParticipateEventQuery {
    return { pagination: this.pagination };
  }
}
