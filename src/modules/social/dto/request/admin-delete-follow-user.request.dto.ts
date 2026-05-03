import type { AdminDeleteFollowCommand } from '@volontariapp/contracts';
import type { AdminDeleteFollowCommand as AdminDeleteFollowCommandType } from '@volontariapp/contracts-nest';

export class AdminDeleteFollowUserRequestDTO implements AdminDeleteFollowCommand {
  followerId!: string;
  followedId!: string;

  toCommand(): AdminDeleteFollowCommandType {
    return { followerId: this.followerId, followedId: this.followedId };
  }
}
