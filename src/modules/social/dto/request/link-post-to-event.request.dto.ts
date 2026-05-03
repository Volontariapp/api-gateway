import type { LinkPostToEventCommand } from '@volontariapp/contracts';
import type { LinkPostToEventCommand as LinkPostToEventCommandType } from '@volontariapp/contracts-nest';

export class LinkPostToEventRequestDTO implements LinkPostToEventCommand {
  postId!: string;
  eventId!: string;

  toCommand(): LinkPostToEventCommandType {
    return { postId: this.postId, eventId: this.eventId };
  }
}
