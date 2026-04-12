import type { GetEventQuery } from '@volontariapp/contracts-nest';
import type { GetEventRequest } from '@volontariapp/contracts';

export class GetEventRequestDTO implements GetEventRequest {
  id!: string;

  toQuery(): GetEventQuery {
    return { id: this.id };
  }
}
