import type {
  CreateSocialEventCommand,
  CreateSocialEventWebRequest,
} from '@volontariapp/contracts';

export class CreateEventNodeRequestDTO implements CreateSocialEventWebRequest {
  eventId!: string;

  toCommand(): CreateSocialEventCommand {
    return { eventId: this.eventId };
  }
}
