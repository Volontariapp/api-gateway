import type { DeleteSocialPostCommand, DeleteSocialPostWebRequest } from '@volontariapp/contracts';

export class DeletePostNodeRequestDTO implements DeleteSocialPostWebRequest {
  postId!: string;

  toCommand(): DeleteSocialPostCommand {
    return { postId: this.postId };
  }
}
