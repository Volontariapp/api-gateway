import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { GetRankingFeedQuery } from '@volontariapp/contracts-nest';
import type { GetRankingFeedWebRequest } from '@volontariapp/contracts';
import {
  RANKING_CURSOR_MAX_LENGTH,
  RANKING_DEFAULT_LIMIT,
  RANKING_MAX_LIMIT,
} from '../../constants/ranking.constants.js';
import { clampRankingLimit } from '../../helpers/ranking-limit.helper.js';

export class GetRankingFeedRequestDTO implements GetRankingFeedWebRequest {
  @ApiPropertyOptional({
    description: 'Opaque cursor returned as ranking.nextCursor by the previous page',
    example: 'eyJ2IjoxLCJsIjoiLi4uIiwiciI6MjB9',
  })
  @IsOptional()
  @IsString()
  @MaxLength(RANKING_CURSOR_MAX_LENGTH)
  cursor?: string;

  @ApiPropertyOptional({
    example: RANKING_DEFAULT_LIMIT,
    default: RANKING_DEFAULT_LIMIT,
    minimum: 1,
    maximum: RANKING_MAX_LIMIT,
    description: `Page size, capped at ${String(RANKING_MAX_LIMIT)}`,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  toQuery(): GetRankingFeedQuery {
    return { cursor: this.cursor ?? '', limit: clampRankingLimit(this.limit) };
  }
}
