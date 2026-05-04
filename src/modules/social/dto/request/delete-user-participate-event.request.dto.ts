import type { DeleteUserParticipateEventCommand } from '@volontariapp/contracts';
import type { DeleteUserParticipateEventCommand as DeleteUserParticipateEventCommandType } from '@volontariapp/contracts-nest';

export class DeleteUserParticipateEventRequestDTO implements DeleteUserParticipateEventCommand {
  eventId!: string;

  toCommand(): DeleteUserParticipateEventCommandType {
    return { eventId: this.eventId };
  }
}
