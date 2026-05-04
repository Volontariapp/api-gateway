import type {
  AdminDeleteBlockUserWebRequest,
  AdminDeleteBlockUserCommand,
} from '@volontariapp/contracts';

export class AdminDeleteBlockUserRequestDTO implements AdminDeleteBlockUserWebRequest {
  blockerId!: string;
  blockedId!: string;

  toCommand(): AdminDeleteBlockUserCommand {
    return { blockerId: this.blockerId, blockedId: this.blockedId };
  }
}
