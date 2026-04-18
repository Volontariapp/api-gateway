import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetWhoBlockedMeQuery } from '@volontariapp/contracts-nest';
import { GetWhoBlockedMeWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetWhoBlockedMeRequestDTO implements GetWhoBlockedMeWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  userId!: string;

  toQuery(): GetWhoBlockedMeQuery {
    return {
      userId: this.userId,
      pagination: this.pagination,
    };
  }
}
