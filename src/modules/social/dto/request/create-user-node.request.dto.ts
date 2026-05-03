import type { CreateSocialUserCommand } from '@volontariapp/contracts';
import type { CreateSocialUserCommand as CreateSocialUserCommandType } from '@volontariapp/contracts-nest';

export class CreateUserNodeRequestDTO implements CreateSocialUserCommand {
  userId!: string;

  toCommand(): CreateSocialUserCommandType {
    return { userId: this.userId };
  }
}
