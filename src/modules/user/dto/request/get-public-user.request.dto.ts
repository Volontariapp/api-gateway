import type { GetUserRequest } from '@volontariapp/contracts';
import type { GetUserQuery } from '@volontariapp/contracts-nest';

export class GetPublicUserRequestDTO implements GetUserRequest {
  userId!: string;

  toQuery(): GetUserQuery {
    return { userId: this.userId };
  }
}
