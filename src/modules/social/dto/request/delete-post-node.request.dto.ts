import type { DeleteSocialPostCommand } from '@volontariapp/contracts';
import type { DeleteSocialPostCommand as DeleteSocialPostCommandType } from '@volontariapp/contracts-nest';

export class DeletePostNodeRequestDTO implements DeleteSocialPostCommand {
  postId!: string;

  toCommand(): DeleteSocialPostCommandType {
    return { postId: this.postId };
  }
}
