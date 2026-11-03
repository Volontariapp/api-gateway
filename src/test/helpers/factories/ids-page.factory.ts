import type { IdsPageResponse } from '../../../common/pagination/index.js';

export class IdsPageFactory {
  /** `count` ids distincts, numerotes de `start` (id-0, id-1, ...). */
  static createIds(count: number, start = 0): string[] {
    return Array.from({ length: count }, (_, i) => `id-${String(start + i)}`);
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
