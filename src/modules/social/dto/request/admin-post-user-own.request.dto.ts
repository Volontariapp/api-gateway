import type { AdminPostUserOwnCommand } from '@volontariapp/contracts';
import type { AdminPostUserOwnCommand as AdminPostUserOwnCommandType } from '@volontariapp/contracts-nest';

export class AdminPostUserOwnRequestDTO implements AdminPostUserOwnCommand {
  userId!: string;
  postId!: string;

  toCommand(): AdminPostUserOwnCommandType {
    return { userId: this.userId, postId: this.postId };
  }
}
