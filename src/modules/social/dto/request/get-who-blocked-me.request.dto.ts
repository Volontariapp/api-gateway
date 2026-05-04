import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetWhoBlockedMeQuery } from '@volontariapp/contracts-nest';
import { GetWhoBlockedMeWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetWhoBlockedMeRequestDTO implements GetWhoBlockedMeWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetWhoBlockedMeQuery {
    return { pagination: this.pagination };
  }
}
