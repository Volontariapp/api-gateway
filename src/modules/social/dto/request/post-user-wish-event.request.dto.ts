import type { PostUserWishEventCommand } from '@volontariapp/contracts';
import type { PostUserWishEventCommand as PostUserWishEventCommandType } from '@volontariapp/contracts-nest';

export class PostUserWishEventRequestDTO implements PostUserWishEventCommand {
  eventId!: string;

  toCommand(): PostUserWishEventCommandType {
    return { eventId: this.eventId };
  }
}
