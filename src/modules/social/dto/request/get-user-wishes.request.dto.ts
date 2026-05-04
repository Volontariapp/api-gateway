import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetUserWishEventQuery } from '@volontariapp/contracts-nest';
import { GetUserWishEventWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../common/pagination.dto.js';

export class GetUserWishesRequestDTO implements GetUserWishEventWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  toQuery(): GetUserWishEventQuery {
    return { pagination: this.pagination };
  }
}
