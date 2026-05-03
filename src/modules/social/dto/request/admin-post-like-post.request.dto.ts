import type { AdminPostLikePostCommand } from '@volontariapp/contracts';
import type { AdminPostLikePostCommand as AdminPostLikePostCommandType } from '@volontariapp/contracts-nest';

export class AdminPostLikePostRequestDTO implements AdminPostLikePostCommand {
  userId!: string;
  postId!: string;

  toCommand(): AdminPostLikePostCommandType {
    return { userId: this.userId, postId: this.postId };
  }
}
