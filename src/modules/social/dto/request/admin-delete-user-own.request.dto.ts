import type { AdminDeleteUserOwnCommand } from '@volontariapp/contracts';
import type { AdminDeleteUserOwnCommand as AdminDeleteUserOwnCommandType } from '@volontariapp/contracts-nest';

export class AdminDeleteUserOwnRequestDTO implements AdminDeleteUserOwnCommand {
  userId!: string;
  postId!: string;

  toCommand(): AdminDeleteUserOwnCommandType {
    return { userId: this.userId, postId: this.postId };
  }
}
