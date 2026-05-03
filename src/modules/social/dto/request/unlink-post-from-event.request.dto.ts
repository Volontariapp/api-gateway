import type { UnlinkPostFromEventCommand } from '@volontariapp/contracts';
import type { UnlinkPostFromEventCommand as UnlinkPostFromEventCommandType } from '@volontariapp/contracts-nest';

export class UnlinkPostFromEventRequestDTO implements UnlinkPostFromEventCommand {
  postId!: string;
  eventId!: string;

  toCommand(): UnlinkPostFromEventCommandType {
    return { postId: this.postId, eventId: this.eventId };
  }
}
