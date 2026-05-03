import type { DeleteSocialEventCommand } from '@volontariapp/contracts';
import type { DeleteSocialEventCommand as DeleteSocialEventCommandType } from '@volontariapp/contracts-nest';

export class DeleteEventNodeRequestDTO implements DeleteSocialEventCommand {
  eventId!: string;

  toCommand(): DeleteSocialEventCommandType {
    return { eventId: this.eventId };
  }
}
