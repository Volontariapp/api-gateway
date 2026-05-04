import type {
  AdminPostBlockUserWebRequest,
  AdminPostBlockUserCommand,
} from '@volontariapp/contracts';

export class AdminPostBlockUserRequestDTO implements AdminPostBlockUserWebRequest {
  blockerId!: string;
  blockedId!: string;

  toCommand(): AdminPostBlockUserCommand {
    return { blockerId: this.blockerId, blockedId: this.blockedId };
  }
}
