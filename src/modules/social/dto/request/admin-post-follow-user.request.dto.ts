import type {
  AdminPostFollowUserWebRequest,
  AdminPostFollowUserCommand,
} from '@volontariapp/contracts';

export class AdminPostFollowUserRequestDTO implements AdminPostFollowUserWebRequest {
  followerId!: string;
  followedId!: string;

  toCommand(): AdminPostFollowUserCommand {
    return { followerId: this.followerId, followedId: this.followedId };
  }
}
