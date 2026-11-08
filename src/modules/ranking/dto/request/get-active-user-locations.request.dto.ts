import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import type { GetActiveUserLocationsQuery } from '@volontariapp/contracts-nest';
import type { GetActiveUserLocationsWebRequest } from '@volontariapp/contracts';

/** One day at most: an older position is not "active". Same cap as ms-ranking. */
const MAX_MAX_AGE_MINUTES = 1440;

export class GetActiveUserLocationsRequestDTO implements GetActiveUserLocationsWebRequest {
  @ApiPropertyOptional({
    example: 30,
    minimum: 0,
    maximum: MAX_MAX_AGE_MINUTES,
    description: 'Only the positions sent less than this many minutes ago. 0 or absent: 30.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MAX_AGE_MINUTES)
  maxAgeMinutes?: number;

  toQuery(): GetActiveUserLocationsQuery {
    return { maxAgeMinutes: this.maxAgeMinutes ?? 0 };
  }
}
