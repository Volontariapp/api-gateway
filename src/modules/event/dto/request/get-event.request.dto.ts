import type { GetEventQuery } from '@volontariapp/contracts-nest';

export class GetEventRequestDTO implements GetEventQuery {
  id!: string;

  toQuery(): GetEventQuery {
    return { id: this.id };
  }
}
