import type {
  DeleteSocialEventCommand,
  DeleteSocialEventWebRequest,
} from '@volontariapp/contracts';

export class DeleteEventNodeRequestDTO implements DeleteSocialEventWebRequest {
  eventId!: string;

  toCommand(): DeleteSocialEventCommand {
    return { eventId: this.eventId };
  }
}
