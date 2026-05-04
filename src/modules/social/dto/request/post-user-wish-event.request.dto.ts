import type {
  PostUserWishEventCommand,
  PostUserWishEventWebRequest,
} from '@volontariapp/contracts';

export class PostUserWishEventRequestDTO implements PostUserWishEventWebRequest {
  eventId!: string;

  toCommand(): PostUserWishEventCommand {
    return { eventId: this.eventId };
  }
}
