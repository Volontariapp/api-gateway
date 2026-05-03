import type { CreateFollowCommand } from '@volontariapp/contracts';
import type { CreateFollowCommand as CreateFollowCommandType } from '@volontariapp/contracts-nest';

export class PostFollowUserRequestDTO implements CreateFollowCommand {
  followedId!: string;

  toCommand(): CreateFollowCommandType {
    return { followedId: this.followedId };
  }
}
