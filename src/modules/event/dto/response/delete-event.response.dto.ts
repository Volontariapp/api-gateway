import { ApiProperty } from '@nestjs/swagger';
import type { DeleteEventResponse } from '@volontariapp/contracts-nest';
import type { ActionSuccessWebResponse } from '@volontariapp/contracts';

export class DeleteEventResponseDTO
  implements DeleteEventResponse, ActionSuccessWebResponse
{
  @ApiProperty({ example: true })
  success!: boolean;
}
