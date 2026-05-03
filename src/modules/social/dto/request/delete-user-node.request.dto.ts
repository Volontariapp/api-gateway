import type { DeleteSocialUserCommand } from '@volontariapp/contracts';
import type { DeleteSocialUserCommand as DeleteSocialUserCommandType } from '@volontariapp/contracts-nest';

export class DeleteUserNodeRequestDTO implements DeleteSocialUserCommand {
  userId!: string;

  toCommand(): DeleteSocialUserCommandType {
    return { userId: this.userId };
  }
}
