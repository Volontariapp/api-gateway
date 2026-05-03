import type { AdminDeleteUserWishEventCommand } from '@volontariapp/contracts';
import type { AdminDeleteUserWishEventCommand as AdminDeleteUserWishEventCommandType } from '@volontariapp/contracts-nest';

export class AdminDeleteUserWishEventRequestDTO implements AdminDeleteUserWishEventCommand {
  userId!: string;
  eventId!: string;

  toCommand(): AdminDeleteUserWishEventCommandType {
    return { userId: this.userId, eventId: this.eventId };
  }
}
