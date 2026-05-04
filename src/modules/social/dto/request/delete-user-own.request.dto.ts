import type { DeleteUserOwnCommand, DeleteUserOwnWebRequest } from '@volontariapp/contracts';

export class DeleteUserOwnRequestDTO implements DeleteUserOwnWebRequest {
  postId!: string;

  toCommand(): DeleteUserOwnCommand {
    return { postId: this.postId };
  }
}
