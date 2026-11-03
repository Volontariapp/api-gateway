import { jest } from '@jest/globals';
import type { PaginationRequest } from '@volontariapp/contracts';
import type { IdsPageResponse } from '../../../common/pagination/index.js';
import { IdsPageFactory } from '../factories/ids-page.factory.js';

/** Source paginee simulee de `total` ids: renvoie la page demandee comme le ferait ms-social. */
export function createIdsPagesSource(total: number) {
  return jest.fn((pagination: PaginationRequest): Promise<IdsPageResponse> =>
    Promise.resolve(IdsPageFactory.createPage(total, pagination.page, pagination.limit)),
  );
}
