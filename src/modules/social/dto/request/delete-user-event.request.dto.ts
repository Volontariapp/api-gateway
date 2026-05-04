import type { DeleteUserEventCommand, DeleteUserEventWebRequest } from '@volontariapp/contracts';

export class DeleteUserEventRequestDTO implements DeleteUserEventWebRequest {
  eventId!: string;
  userId!: string;

  toCommand(): DeleteUserEventCommand {
    return { eventId: this.eventId, userId: this.userId };
  }
}
