import type {
  AdminPostUserWishEventCommand,
  AdminPostUserWishEventWebRequest,
} from '@volontariapp/contracts';

export class AdminPostUserWishEventRequestDTO implements AdminPostUserWishEventWebRequest {
  userId!: string;
  eventId!: string;

  toCommand(): AdminPostUserWishEventCommand {
    return { userId: this.userId, eventId: this.eventId };
  }
}
