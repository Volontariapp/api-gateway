import type {
  PostUserParticipateEventCommand,
  PostUserParticipateEventWebRequest,
} from '@volontariapp/contracts';

export class PostUserParticipateEventRequestDTO implements PostUserParticipateEventWebRequest {
  eventId!: string;

  toCommand(): PostUserParticipateEventCommand {
    return { eventId: this.eventId };
  }
}
