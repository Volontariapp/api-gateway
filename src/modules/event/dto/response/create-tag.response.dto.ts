import { ApiProperty } from '@nestjs/swagger';
import type { TagWebResponse } from '@volontariapp/contracts';
import { TagDTO } from '../common/common.dto.js';

export class CreateTagResponseDTO implements TagWebResponse {
  @ApiProperty({ type: TagDTO, required: true })
  tag!: TagDTO;
}
