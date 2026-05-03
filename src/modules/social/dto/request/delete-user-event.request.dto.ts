import type { DeleteUserEventCommand } from '@volontariapp/contracts';
import type { DeleteUserEventCommand as DeleteUserEventCommandType } from '@volontariapp/contracts-nest';

export class DeleteUserEventRequestDTO implements DeleteUserEventCommand {
  userId!: string;
  eventId!: string;

  toCommand(): DeleteUserEventCommandType {
    return { userId: this.userId, eventId: this.eventId };
  }
}
