import type { CreateSocialPostCommand, CreateSocialPostWebRequest } from '@volontariapp/contracts';

export class CreatePostNodeRequestDTO implements CreateSocialPostWebRequest {
  postId!: string;

  toCommand(): CreateSocialPostCommand {
    return { postId: this.postId };
  }
}
