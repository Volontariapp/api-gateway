import type { AdminPostUserWishEventCommand } from '@volontariapp/contracts';
import type { AdminPostUserWishEventCommand as AdminPostUserWishEventCommandType } from '@volontariapp/contracts-nest';

export class AdminPostUserWishEventRequestDTO implements AdminPostUserWishEventCommand {
  userId!: string;
  eventId!: string;

  toCommand(): AdminPostUserWishEventCommandType {
    return { userId: this.userId, eventId: this.eventId };
  }
}
