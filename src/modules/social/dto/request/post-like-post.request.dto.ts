import type { PostLikePostCommand, PostLikePostWebRequest } from '@volontariapp/contracts';

export class PostLikePostRequestDTO implements PostLikePostWebRequest {
  postId!: string;

  toCommand(): PostLikePostCommand {
    return { postId: this.postId };
  }
}
