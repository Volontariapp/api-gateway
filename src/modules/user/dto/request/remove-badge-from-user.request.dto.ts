import type { RemoveBadgeFromUserRequest } from '@volontariapp/contracts';
import type { RemoveBadgeFromUserCommand } from '@volontariapp/contracts-nest';

export class RemoveBadgeFromUserRequestDTO implements RemoveBadgeFromUserRequest {
  userId!: string;

  badgeId!: string;

  toCommand(): RemoveBadgeFromUserCommand {
    return {
      userId: this.userId,
      badgeId: this.badgeId,
    };
  }
}
