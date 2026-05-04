import type {
  AdminDeleteLikePostCommand,
  AdminDeleteLikePostWebRequest,
} from '@volontariapp/contracts';

export class AdminDeleteLikePostRequestDTO implements AdminDeleteLikePostWebRequest {
  userId!: string;
  postId!: string;

  toCommand(): AdminDeleteLikePostCommand {
    return { userId: this.userId, postId: this.postId };
  }
}
