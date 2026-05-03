import type { PostUserParticipateEventCommand } from '@volontariapp/contracts';
import type { PostUserParticipateEventCommand as PostUserParticipateEventCommandType } from '@volontariapp/contracts-nest';

export class PostUserParticipateEventRequestDTO implements PostUserParticipateEventCommand {
  eventId!: string;

  toCommand(): PostUserParticipateEventCommandType {
    return { eventId: this.eventId };
  }
}
