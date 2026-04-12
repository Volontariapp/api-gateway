import { ApiProperty } from '@nestjs/swagger';
import { ListRequirementsResponse } from '@volontariapp/contracts-nest';
import { ListRequirementsWebResponse } from '@volontariapp/contracts';
import { RequirementDTO } from '../common/common.dto.js';

export class ListRequirementsResponseDTO
  implements ListRequirementsResponse, ListRequirementsWebResponse
{
  @ApiProperty({ type: [RequirementDTO] })
  requirements!: RequirementDTO[];
}
