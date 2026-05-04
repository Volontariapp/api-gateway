import type {
  AdminDeleteUserWishEventCommand,
  AdminDeleteUserWishEventWebRequest,
} from '@volontariapp/contracts';

export class AdminDeleteUserWishEventRequestDTO implements AdminDeleteUserWishEventWebRequest {
  userId!: string;
  eventId!: string;

  toCommand(): AdminDeleteUserWishEventCommand {
    return { userId: this.userId, eventId: this.eventId };
  }
}
