import type { PostUserEventCommand, PostUserEventWebRequest } from '@volontariapp/contracts';

export class PostUserEventRequestDTO implements PostUserEventWebRequest {
  eventId!: string;

  userId!: string;

  toCommand(): PostUserEventCommand {
    return { eventId: this.eventId, userId: this.userId };
  }
}
