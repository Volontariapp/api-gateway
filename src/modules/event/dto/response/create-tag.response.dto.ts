import { ApiProperty } from '@nestjs/swagger';
import { CreateTagResponse } from '@volontariapp/contracts-nest';
import { TagWebResponse } from '@volontariapp/contracts';
import { TagDTO } from '../common/common.dto.js';

export class CreateTagResponseDTO implements CreateTagResponse, TagWebResponse {
  @ApiProperty({ type: TagDTO, required: true })
  tag!: TagDTO;
}
