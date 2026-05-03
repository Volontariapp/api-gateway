import type { DeleteBadgeRequest } from '@volontariapp/contracts';
import type { DeleteBadgeCommand } from '@volontariapp/contracts-nest';

export class DeleteBadgeRequestDTO implements DeleteBadgeRequest {
  badgeId!: string;

  toCommand(): DeleteBadgeCommand {
    return {
      badgeId: this.badgeId,
    };
  }
}
