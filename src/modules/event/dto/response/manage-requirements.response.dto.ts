import { ApiProperty } from '@nestjs/swagger';
import type { ActionSuccessWebResponse } from '@volontariapp/contracts';

export class ManageRequirementsResponseDTO implements ActionSuccessWebResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Requirement processed successfully' })
  message!: string;
}
