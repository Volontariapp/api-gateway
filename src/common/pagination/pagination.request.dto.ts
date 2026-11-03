import type { Type } from '@nestjs/common';
import type { PaginationRequest } from '@volontariapp/contracts';
import { PaginationLimit, PaginationPage } from './pagination.decorators.js';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  LEGACY_MAX_LIMIT,
  MAX_LIMIT,
} from './pagination.constants.js';

/**
 * Fabrique un DTO imbrique `pagination[page|limit]` dont la limite est plafonnee a `maxLimit`.
 * Une classe neuve par plafond : les decorateurs de la limite ne se cumulent pas par heritage.
 */
export function createPaginationRequestDTO(maxLimit: number): Type<PaginationRequest> {
  class PaginationRequestBase implements PaginationRequest {
    @PaginationPage()
    page: number = DEFAULT_PAGE;

    @PaginationLimit(maxLimit)
    limit: number = DEFAULT_LIMIT;
  }
  return PaginationRequestBase;
}

/** Pagination imbrique standard (plafond MAX_LIMIT). */
export class PaginationRequestDTO extends createPaginationRequestDTO(MAX_LIMIT) {}

/** Pagination imbrique des routes appelees avec limit=500 par les anciennes versions de l'app. */
export class LegacyPaginationRequestDTO extends createPaginationRequestDTO(LEGACY_MAX_LIMIT) {}
