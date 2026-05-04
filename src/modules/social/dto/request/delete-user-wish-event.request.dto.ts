import type {
  DeleteUserWishEventCommand,
  DeleteUserWishEventWebRequest,
} from '@volontariapp/contracts';

export class DeleteUserWishEventRequestDTO implements DeleteUserWishEventWebRequest {
  eventId!: string;

  toCommand(): DeleteUserWishEventCommand {
    return { eventId: this.eventId };
  }
}
