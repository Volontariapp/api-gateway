import type { PostLikePostCommand } from '@volontariapp/contracts';
import type { PostLikePostCommand as PostLikePostCommandType } from '@volontariapp/contracts-nest';

export class PostLikePostRequestDTO implements PostLikePostCommand {
  postId!: string;

  toCommand(): PostLikePostCommandType {
    return { postId: this.postId };
  }
}
