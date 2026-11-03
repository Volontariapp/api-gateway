import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { clampPaginationLimit } from './clamp-pagination-limit.helper.js';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from './pagination.constants.js';

/** Numero de page : entier >= 1 (une valeur invalide donne un 400). */
export function PaginationPage(): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({
      example: DEFAULT_PAGE,
      minimum: 1,
      description: `Numero de page, a partir de ${String(DEFAULT_PAGE)}`,
    }),
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
  );
}

/** Taille de page : entier >= 1, ecretee a `maxLimit` si elle le depasse (jamais rejetee pour cela). */
export function PaginationLimit(maxLimit: number = MAX_LIMIT): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({
      example: DEFAULT_LIMIT,
      minimum: 1,
      maximum: maxLimit,
      description: `Taille de page, plafonnee a ${String(maxLimit)} (une valeur superieure est ramenee a ${String(maxLimit)})`,
    }),
    IsOptional(),
    Type(() => Number),
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'number' && Number.isInteger(value) && value > 0
        ? clampPaginationLimit(value, maxLimit)
        : value,
    ),
    IsInt(),
    Min(1),
  );
}

/** Champ imbrique `pagination[page|limit]` (query parser qs), valide avec le DTO fourni. */
export function NestedPagination(dto: new () => object): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({ type: dto }),
    IsOptional(),
    ValidateNested(),
    Type(() => dto),
  );
}
