import type { Type } from '@nestjs/common';
import type { PaginationRequest } from '@volontariapp/contracts';
import { PaginationLimit, PaginationPage } from './pagination.decorators.js';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from './pagination.constants.js';

export interface FlatPaginationQuery {
  page?: number;
  limit?: number;
  readonly pagination: PaginationRequest | undefined;
}

/**
 * Fabrique un DTO de query plate `?page=&limit=` avec un getter `pagination` (undefined si ni page ni limit).
 * Le setter ignore toute valeur : une query `pagination[...]` envoyee en meme temps ne doit pas faire planter
 * class-transformer (le getter est herite, il ne le voit pas comme accesseur sans setter).
 */
export function createFlatPaginationQueryDTO(maxLimit: number): Type<FlatPaginationQuery> {
  class FlatPaginationQueryBase implements FlatPaginationQuery {
    @PaginationPage()
    page?: number;

    @PaginationLimit(maxLimit)
    limit?: number;

    get pagination(): PaginationRequest | undefined {
      if (this.page !== undefined || this.limit !== undefined) {
        return { page: this.page ?? DEFAULT_PAGE, limit: this.limit ?? DEFAULT_LIMIT };
      }
      return undefined;
    }

    set pagination(_ignored: PaginationRequest | undefined) {
      // Volontairement vide : voir le commentaire de la fabrique.
    }
  }
  return FlatPaginationQueryBase;
}

/** Query plate standard (plafond MAX_LIMIT). */
export class FlatPaginationQueryDTO extends createFlatPaginationQueryDTO(MAX_LIMIT) {}
