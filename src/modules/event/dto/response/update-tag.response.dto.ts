import { ApiProperty } from '@nestjs/swagger';
import type { UpdateTagResponse } from '@volontariapp/contracts-nest';
import type { TagWebResponse } from '@volontariapp/contracts';
import { TagDTO } from '../common/common.dto.js';

export class UpdateTagResponseDTO implements UpdateTagResponse, TagWebResponse {
  @ApiProperty({ type: TagDTO, required: true })
  tag!: TagDTO;
}
