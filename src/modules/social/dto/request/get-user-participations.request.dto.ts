import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetUserParticipateEventQuery } from '@volontariapp/contracts-nest';
import { GetUserParticipateEventWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetUserParticipationsRequestDTO implements GetUserParticipateEventWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetUserParticipateEventQuery {
    return { pagination: this.pagination };
  }
}
