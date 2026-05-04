import type {
  UnlinkPostFromEventCommand,
  UnlinkPostFromEventWebRequest,
} from '@volontariapp/contracts';

export class UnlinkPostFromEventRequestDTO implements UnlinkPostFromEventWebRequest {
  postId!: string;
  eventId!: string;

  toCommand(): UnlinkPostFromEventCommand {
    return { postId: this.postId, eventId: this.eventId };
  }
}
