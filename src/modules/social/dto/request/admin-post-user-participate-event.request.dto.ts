import type { AdminPostUserParticipateEventCommand } from '@volontariapp/contracts';
import type { AdminPostUserParticipateEventCommand as AdminPostUserParticipateEventCommandType } from '@volontariapp/contracts-nest';

export class AdminPostUserParticipateEventRequestDTO
  implements AdminPostUserParticipateEventCommand
{
  userId!: string;
  eventId!: string;

  toCommand(): AdminPostUserParticipateEventCommandType {
    return { userId: this.userId, eventId: this.eventId };
  }
}
