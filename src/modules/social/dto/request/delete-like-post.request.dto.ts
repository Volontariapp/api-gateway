import type { DeleteLikePostCommand, DeleteLikePostWebRequest } from '@volontariapp/contracts';

export class DeleteLikePostRequestDTO implements DeleteLikePostWebRequest {
  postId!: string;

  toCommand(): DeleteLikePostCommand {
    return { postId: this.postId };
  }
}
