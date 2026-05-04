import type { DeleteFollowUserCommand, DeleteFollowUserWebRequest } from '@volontariapp/contracts';

export class DeleteFollowUserRequestDTO implements DeleteFollowUserWebRequest {
  followedId!: string;

  toCommand(): DeleteFollowUserCommand {
    return { followedId: this.followedId };
  }
}
