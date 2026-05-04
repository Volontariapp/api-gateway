import type {
  AdminDeleteFollowUserWebRequest,
  AdminDeleteFollowUserCommand,
} from '@volontariapp/contracts';

export class AdminDeleteFollowUserRequestDTO implements AdminDeleteFollowUserWebRequest {
  followerId!: string;
  followedId!: string;

  toCommand(): AdminDeleteFollowUserCommand {
    return { followerId: this.followerId, followedId: this.followedId };
  }
}
