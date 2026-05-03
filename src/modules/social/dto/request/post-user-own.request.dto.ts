import type { PostUserOwnCommand } from '@volontariapp/contracts';
import type { PostUserOwnCommand as PostUserOwnCommandType } from '@volontariapp/contracts-nest';

export class PostUserOwnRequestDTO implements PostUserOwnCommand {
  postId!: string;

  toCommand(): PostUserOwnCommandType {
    return { postId: this.postId };
  }
}
