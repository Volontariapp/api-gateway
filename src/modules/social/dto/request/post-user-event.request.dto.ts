import type { PostUserEventCommand } from '@volontariapp/contracts';
import type { PostUserEventCommand as PostUserEventCommandType } from '@volontariapp/contracts-nest';

export class PostUserEventRequestDTO implements PostUserEventCommand {
  userId!: string;
  eventId!: string;

  toCommand(): PostUserEventCommandType {
    return { userId: this.userId, eventId: this.eventId };
  }
}
