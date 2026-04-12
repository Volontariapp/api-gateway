import { ApiProperty } from '@nestjs/swagger';
import type { DeleteTagResponse } from '@volontariapp/contracts-nest';
import type { ActionSuccessWebResponse } from '@volontariapp/contracts';

export class DeleteTagResponseDTO
  implements DeleteTagResponse, ActionSuccessWebResponse
{
  @ApiProperty({ example: true })
  success!: boolean;
}
