/** Query telle que la voit le ValidationPipe apres le parser qs (valeurs en string). */
export type PaginationQuery = Record<string, unknown>;

export const createFlatPaginationQuery = (page: string, limit: string): PaginationQuery => ({
  page,
  limit,
});

export const createNestedPaginationQuery = (page: string, limit: string): PaginationQuery => ({
  pagination: { page, limit },
});

/** Les deux formes en meme temps, comme le fait nativapp pour les likes. */
export const createBothFormsPaginationQuery = (page: string, limit: string): PaginationQuery => ({
  ...createFlatPaginationQuery(page, limit),
  ...createNestedPaginationQuery(page, limit),
});
