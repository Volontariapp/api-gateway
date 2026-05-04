import type { CreateSocialUserCommand, CreateSocialUserWebRequest } from '@volontariapp/contracts';

export class CreateUserNodeRequestDTO implements CreateSocialUserWebRequest {
  userId!: string;

  toCommand(): CreateSocialUserCommand {
    return { userId: this.userId };
  }
}
