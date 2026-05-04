import type {
  AdminPostUserParticipateEventCommand,
  AdminPostUserParticipateEventWebRequest,
} from '@volontariapp/contracts';

export class AdminPostUserParticipateEventRequestDTO
  implements AdminPostUserParticipateEventWebRequest
{
  userId!: string;
  eventId!: string;

  toCommand(): AdminPostUserParticipateEventCommand {
    return { userId: this.userId, eventId: this.eventId };
  }
}
