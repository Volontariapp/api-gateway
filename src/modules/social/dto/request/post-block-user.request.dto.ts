import type { PostBlockUserWebRequest, PostBlockUserCommand } from '@volontariapp/contracts';

export class PostBlockUserRequestDTO implements PostBlockUserWebRequest {
  blockedId!: string;

  toCommand(): PostBlockUserCommand {
    return { blockedId: this.blockedId };
  }
}
