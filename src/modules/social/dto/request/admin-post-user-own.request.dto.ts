import type { AdminPostUserOwnCommand, AdminPostUserOwnWebRequest } from '@volontariapp/contracts';

export class AdminPostUserOwnRequestDTO implements AdminPostUserOwnWebRequest {
  userId!: string;
  postId!: string;

  toCommand(): AdminPostUserOwnCommand {
    return { userId: this.userId, postId: this.postId };
  }
}
