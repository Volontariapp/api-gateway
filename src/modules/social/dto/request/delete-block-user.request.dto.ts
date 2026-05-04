import type { DeleteBlockUserCommand, DeleteBlockUserWebRequest } from '@volontariapp/contracts';

export class DeleteBlockUserRequestDTO implements DeleteBlockUserWebRequest {
  blockedId!: string;

  toCommand(): DeleteBlockUserCommand {
    return { blockedId: this.blockedId };
  }
}
