import type { IdsPageResponse } from '../../../common/pagination/index.js';

export class IdsPageFactory {
  /**
   * `count` ids distincts au format UUID (les ids d'evenements sont valides comme tels par ms-event),
   * numerotes de `start` dans le dernier groupe (00000000-0000-4000-8000-000000000000, ...0001, ...).
   */
  static createIds(count: number, start = 0): string[] {
    return Array.from(
      { length: count },
      (_, i) => `00000000-0000-4000-8000-${String(start + i).padStart(12, '0')}`,
    );
  }

  /** Reponse de la page `page` (base 1) d'un ensemble de `total` ids, pages de `limit`. */
  static createPage(total: number, page: number, limit: number): IdsPageResponse {
    const start = (page - 1) * limit;
    const count = Math.max(0, Math.min(limit, total - start));
    return {
      ids: IdsPageFactory.createIds(count, start),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
