import type { CreateSocialEventCommand } from '@volontariapp/contracts';
import type { CreateSocialEventCommand as CreateSocialEventCommandType } from '@volontariapp/contracts-nest';

export class CreateEventNodeRequestDTO implements CreateSocialEventCommand {
  eventId!: string;

  toCommand(): CreateSocialEventCommandType {
    return { eventId: this.eventId };
  }
}
