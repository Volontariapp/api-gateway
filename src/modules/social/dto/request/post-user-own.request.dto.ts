import type { PostUserOwnCommand, PostUserOwnWebRequest } from '@volontariapp/contracts';

export class PostUserOwnRequestDTO implements PostUserOwnWebRequest {
  postId!: string;

  toCommand(): PostUserOwnCommand {
    return { postId: this.postId };
  }
}
