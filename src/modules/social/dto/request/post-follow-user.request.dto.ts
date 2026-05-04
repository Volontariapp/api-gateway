import type { PostFollowUserWebRequest, PostFollowUserCommand } from '@volontariapp/contracts';

export class PostFollowUserRequestDTO implements PostFollowUserWebRequest {
  followedId!: string;

  toCommand(): PostFollowUserCommand {
    return { followedId: this.followedId };
  }
}
