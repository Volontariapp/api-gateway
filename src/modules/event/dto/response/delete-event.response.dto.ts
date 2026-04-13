import { ApiProperty } from '@nestjs/swagger';
import type { ActionSuccessWebResponse } from '@volontariapp/contracts';

export class DeleteEventResponseDTO implements ActionSuccessWebResponse {
  @ApiProperty({ example: true })
  success!: boolean;
}
