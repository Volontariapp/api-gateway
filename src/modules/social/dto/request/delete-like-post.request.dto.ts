import type { DeleteLikePostCommand } from '@volontariapp/contracts';
import type { DeleteLikePostCommand as DeleteLikePostCommandType } from '@volontariapp/contracts-nest';

export class DeleteLikePostRequestDTO implements DeleteLikePostCommand {
  postId!: string;

  toCommand(): DeleteLikePostCommandType {
    return { postId: this.postId };
  }
}
