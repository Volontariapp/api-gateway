import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetUserEventQuery } from '@volontariapp/contracts-nest';
import { GetUserEventWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetUserEventsRequestDTO implements GetUserEventWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetUserEventQuery {
    return {
      pagination: this.pagination,
    };
  }
}
