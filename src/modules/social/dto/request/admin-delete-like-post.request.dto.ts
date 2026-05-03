import type { AdminDeleteLikePostCommand } from '@volontariapp/contracts';
import type { AdminDeleteLikePostCommand as AdminDeleteLikePostCommandType } from '@volontariapp/contracts-nest';

export class AdminDeleteLikePostRequestDTO implements AdminDeleteLikePostCommand {
  userId!: string;
  postId!: string;

  toCommand(): AdminDeleteLikePostCommandType {
    return { userId: this.userId, postId: this.postId };
  }
}
