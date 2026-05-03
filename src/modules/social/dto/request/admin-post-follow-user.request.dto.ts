import type { AdminCreateFollowCommand } from '@volontariapp/contracts';
import type { AdminCreateFollowCommand as AdminCreateFollowCommandType } from '@volontariapp/contracts-nest';

export class AdminPostFollowUserRequestDTO implements AdminCreateFollowCommand {
  followerId!: string;
  followedId!: string;

  toCommand(): AdminCreateFollowCommandType {
    return { followerId: this.followerId, followedId: this.followedId };
  }
}
