import type { DeleteUserOwnCommand } from '@volontariapp/contracts';
import type { DeleteUserOwnCommand as DeleteUserOwnCommandType } from '@volontariapp/contracts-nest';

export class DeleteUserOwnRequestDTO implements DeleteUserOwnCommand {
  postId!: string;

  toCommand(): DeleteUserOwnCommandType {
    return { postId: this.postId };
  }
}
