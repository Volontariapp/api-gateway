import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetUserParticipateEventQuery } from '@volontariapp/contracts-nest';
import { GetUserParticipateEventWebRequest, PaginationRequest } from '@volontariapp/contracts';

export class GetUserParticipationsRequestDTO implements GetUserParticipateEventWebRequest {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  limit?: number;

  get pagination(): PaginationRequest | undefined {
    if (this.page !== undefined || this.limit !== undefined) {
      return { page: this.page ?? 1, limit: this.limit ?? 10 };
    }
    return undefined;
  }

  toQuery(): GetUserParticipateEventQuery {
    return { pagination: this.pagination };
  }
}
