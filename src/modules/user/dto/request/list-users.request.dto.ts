import { ListUsersRequest } from '@volontariapp/contracts';
import { ListUsersQuery } from '@volontariapp/contracts-nest';
import {
  LEGACY_MAX_LIMIT,
  LegacyPaginationRequestDTO,
  NestedPagination,
  PaginationLimit,
  PaginationPage,
} from '../../../../common/pagination/index.js';

/** Defaut de taille de page de la liste admin quand un seul des deux parametres est fourni. */
const ADMIN_USERS_DEFAULT_LIMIT = 50;

/**
 * GET /users (admin). Accepte la forme plate (page et limit, celle de nativapp) et la forme
 * imbriquee (pagination[page] et pagination[limit]). Plafond legacy : l'ancienne app charge tous les users avec limit=500.
 */
export class ListUsersRequestDTO implements ListUsersRequest {
  @NestedPagination(LegacyPaginationRequestDTO)
  pagination?: LegacyPaginationRequestDTO;

  @PaginationPage()
  page?: number;

  @PaginationLimit(LEGACY_MAX_LIMIT)
  limit?: number;

  toQuery(): ListUsersQuery {
    const pageNum = this.pagination?.page ?? this.page;
    const limitNum = this.pagination?.limit ?? this.limit;

    return {
      pagination:
        pageNum !== undefined || limitNum !== undefined
          ? { limit: limitNum ?? ADMIN_USERS_DEFAULT_LIMIT, page: pageNum ?? 1 }
          : undefined,
    };
  }
}
