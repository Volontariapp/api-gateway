import type { DeleteUserWishEventCommand } from '@volontariapp/contracts';
import type { DeleteUserWishEventCommand as DeleteUserWishEventCommandType } from '@volontariapp/contracts-nest';

export class DeleteUserWishEventRequestDTO implements DeleteUserWishEventCommand {
  eventId!: string;

  toCommand(): DeleteUserWishEventCommandType {
    return { eventId: this.eventId };
  }
}
