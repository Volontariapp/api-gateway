import type { PaginationRequest, PaginationResponse } from '@volontariapp/contracts';
import { DEFAULT_PAGE, MAX_LIMIT } from './pagination.constants.js';

/** Taille de page des appels internes qui lisent tout un ensemble d'ids (meme plafond que les routes). */
export const INTERNAL_PAGE_SIZE = MAX_LIMIT;

/** Garde-fou : nombre maximal de pages lues (soit 10 000 ids a 100 par page), contre une boucle infinie. */
export const INTERNAL_MAX_PAGES = 100;

/** Forme commune des reponses gRPC paginees qui ne portent que des ids. */
export interface IdsPageResponse {
  ids: string[];
  pagination: PaginationResponse | undefined;
}

/**
 * Lit toutes les pages d'une liste d'ids, par pages de `INTERNAL_PAGE_SIZE`, et concatene les ids.
 * Arret sur page vide, page courte, `totalPages` atteint, ou `INTERNAL_MAX_PAGES` pages lues (les ids
 * deja lus sont alors renvoyes). Une erreur de `fetchPage` est propagee telle quelle.
 */
export async function fetchAllPages(
  fetchPage: (pagination: PaginationRequest) => Promise<IdsPageResponse>,
  pageSize: number = INTERNAL_PAGE_SIZE,
  maxPages: number = INTERNAL_MAX_PAGES,
): Promise<string[]> {
  const ids: string[] = [];
  for (let page = DEFAULT_PAGE; page < DEFAULT_PAGE + maxPages; page += 1) {
    const response = await fetchPage({ page, limit: pageSize });
    ids.push(...response.ids);
    const totalPages = response.pagination?.totalPages;
    if (
      response.ids.length === 0 ||
      response.ids.length < pageSize ||
      (totalPages !== undefined && page >= totalPages)
    ) {
      break;
    }
  }
  return ids;
}
