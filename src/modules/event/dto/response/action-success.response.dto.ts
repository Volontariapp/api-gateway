import { ApiProperty } from '@nestjs/swagger';
import { ManageRequirementsResponse } from '@volontariapp/contracts-nest';
import { ActionSuccessWebResponse } from '@volontariapp/contracts';

export class ActionSuccessResponseDTO
  implements ActionSuccessWebResponse, ManageRequirementsResponse
{
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Operation completed successfully', required: false })
  message!: string;
}
