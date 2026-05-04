import type {
  AdminDeleteUserParticipateEventCommand,
  AdminDeleteUserParticipateEventWebRequest,
} from '@volontariapp/contracts';

export class AdminDeleteUserParticipateEventRequestDTO
  implements AdminDeleteUserParticipateEventWebRequest
{
  userId!: string;
  eventId!: string;

  toCommand(): AdminDeleteUserParticipateEventCommand {
    return { userId: this.userId, eventId: this.eventId };
  }
}
