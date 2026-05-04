import type { DeleteSocialUserCommand, DeleteSocialUserWebRequest } from '@volontariapp/contracts';

export class DeleteUserNodeRequestDTO implements DeleteSocialUserWebRequest {
  userId!: string;

  toCommand(): DeleteSocialUserCommand {
    return { userId: this.userId };
  }
}
