import type { GetBadgeRequest } from '@volontariapp/contracts';
import type { GetBadgeQuery } from '@volontariapp/contracts-nest';

export class GetBadgeRequestDTO implements GetBadgeRequest {
  badgeId!: string;

  toQuery(): GetBadgeQuery {
    return {
      badgeId: this.badgeId,
    };
  }
}
