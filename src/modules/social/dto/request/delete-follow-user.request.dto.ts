import type { DeleteFollowCommand } from '@volontariapp/contracts';
import type { DeleteFollowCommand as DeleteFollowCommandType } from '@volontariapp/contracts-nest';

export class DeleteFollowUserRequestDTO implements DeleteFollowCommand {
  followedId!: string;

  toCommand(): DeleteFollowCommandType {
    return { followedId: this.followedId };
  }
}
