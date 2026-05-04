import type {
  AdminPostLikePostCommand,
  AdminPostLikePostWebRequest,
} from '@volontariapp/contracts';

export class AdminPostLikePostRequestDTO implements AdminPostLikePostWebRequest {
  userId!: string;
  postId!: string;

  toCommand(): AdminPostLikePostCommand {
    return { userId: this.userId, postId: this.postId };
  }
}
