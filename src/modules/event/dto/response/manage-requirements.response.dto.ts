import { ApiProperty } from '@nestjs/swagger';
import type { ManageRequirementsResponse } from '@volontariapp/contracts-nest';
import type { ActionSuccessWebResponse } from '@volontariapp/contracts';

export class ManageRequirementsResponseDTO
  implements ManageRequirementsResponse, ActionSuccessWebResponse
{
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Requirement processed successfully' })
  message!: string;
}
