import { ApiProperty } from '@nestjs/swagger';
import { UpdateTagResponse } from '@volontariapp/contracts-nest';
import { TagWebResponse } from '@volontariapp/contracts';
import { TagDTO } from '../common/common.dto.js';

export class UpdateTagResponseDTO implements UpdateTagResponse, TagWebResponse {
  @ApiProperty({ type: TagDTO, required: true })
  tag!: TagDTO;
}
