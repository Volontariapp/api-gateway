import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetUserEventQuery } from '@volontariapp/contracts-nest';
import { GetUserEventWebRequest, PaginationRequest } from '@volontariapp/contracts';

export class GetUserEventsRequestDTO implements GetUserEventWebRequest {
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

  toQuery(): GetUserEventQuery {
    return {
      pagination: this.pagination,
    };
  }
}
