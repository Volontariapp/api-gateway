import type { GetBadgeBySlugRequest } from '@volontariapp/contracts';
import type { GetBadgeBySlugQuery } from '@volontariapp/contracts-nest';

export class GetBadgeBySlugRequestDTO implements GetBadgeBySlugRequest {
  slug!: string;

  toQuery(): GetBadgeBySlugQuery {
    return {
      slug: this.slug,
    };
  }
}
