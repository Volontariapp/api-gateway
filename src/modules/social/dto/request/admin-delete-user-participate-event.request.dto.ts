import type { AdminDeleteUserParticipateEventCommand } from '@volontariapp/contracts';
import type { AdminDeleteUserParticipateEventCommand as AdminDeleteUserParticipateEventCommandType } from '@volontariapp/contracts-nest';

export class AdminDeleteUserParticipateEventRequestDTO
  implements AdminDeleteUserParticipateEventCommand
{
  userId!: string;
  eventId!: string;

  toCommand(): AdminDeleteUserParticipateEventCommandType {
    return { userId: this.userId, eventId: this.eventId };
  }
}
