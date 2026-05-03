import type { CreateSocialPostCommand } from '@volontariapp/contracts';
import type { CreateSocialPostCommand as CreateSocialPostCommandType } from '@volontariapp/contracts-nest';

export class CreatePostNodeRequestDTO implements CreateSocialPostCommand {
  postId!: string;

  toCommand(): CreateSocialPostCommandType {
    return { postId: this.postId };
  }
}
