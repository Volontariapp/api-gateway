import type {
  AdminDeleteUserOwnCommand,
  AdminDeleteUserOwnWebRequest,
} from '@volontariapp/contracts';

export class AdminDeleteUserOwnRequestDTO implements AdminDeleteUserOwnWebRequest {
  userId!: string;
  postId!: string;

  toCommand(): AdminDeleteUserOwnCommand {
    return { userId: this.userId, postId: this.postId };
  }
}
