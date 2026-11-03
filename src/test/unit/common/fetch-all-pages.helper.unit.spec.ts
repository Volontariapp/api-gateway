import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { PaginationRequest } from '@volontariapp/contracts';
import {
  fetchAllPages,
  INTERNAL_MAX_PAGES,
  INTERNAL_PAGE_SIZE,
} from '../../../common/pagination/index.js';
import { IdsPageFactory } from '../../helpers/factories/ids-page.factory.js';
import { createIdsPagesSource } from '../../helpers/mocks/ids-pages-source.mock.js';

describe('fetchAllPages (Unit)', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it.each([
    { total: 0, calls: 1 },
    { total: 1, calls: 1 },
    { total: 100, calls: 1 },
    { total: 101, calls: 2 },
    { total: 250, calls: 3 },
  ])('should read $total ids in $calls call(s)', async ({ total, calls }) => {
    const source = createIdsPagesSource(total);

    const ids = await fetchAllPages(source);

    expect(ids).toEqual(IdsPageFactory.createIds(total));
    expect(source).toHaveBeenCalledTimes(calls);
    expect(source).toHaveBeenNthCalledWith(1, { page: 1, limit: INTERNAL_PAGE_SIZE });
  });

  it('should stop on an empty page when the response carries no pagination', async () => {
    const source = jest.fn((p: PaginationRequest) =>
      Promise.resolve({
        ids: IdsPageFactory.createPage(200, p.page, p.limit).ids,
        pagination: undefined,
      }),
    );

    const ids = await fetchAllPages(source);

    expect(ids).toHaveLength(200);
    expect(source).toHaveBeenCalledTimes(3);
  });

  it('should stop at the page cap and return the ids already read', async () => {
    const source = createIdsPagesSource(10 * INTERNAL_PAGE_SIZE);

    const ids = await fetchAllPages(source, INTERNAL_PAGE_SIZE, 3);

    expect(source).toHaveBeenCalledTimes(3);
    expect(ids).toHaveLength(3 * INTERNAL_PAGE_SIZE);
  });

  it('should cap an endless source at INTERNAL_MAX_PAGES calls', async () => {
    const source = jest.fn((p: PaginationRequest) =>
      Promise.resolve({
        ids: IdsPageFactory.createIds(p.limit),
        pagination: { total: 0, page: p.page, limit: p.limit, totalPages: Number.MAX_SAFE_INTEGER },
      }),
    );

    await fetchAllPages(source);

    expect(source).toHaveBeenCalledTimes(INTERNAL_MAX_PAGES);
  });

  it('should propagate a page error', async () => {
    const source = jest.fn(() => Promise.reject(new Error('unavailable')));

    await expect(fetchAllPages(source)).rejects.toThrow('unavailable');
  });
});
