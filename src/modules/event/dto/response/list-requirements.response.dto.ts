import { ApiProperty } from '@nestjs/swagger';
import { ListRequirementsWebResponse } from '@volontariapp/contracts';
import { RequirementDTO } from '../common/common.dto.js';

export class ListRequirementsResponseDTO implements ListRequirementsWebResponse {
  @ApiProperty({ type: [RequirementDTO] })
  requirements!: RequirementDTO[];
}
