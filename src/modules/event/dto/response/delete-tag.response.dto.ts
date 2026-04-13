import { ApiProperty } from '@nestjs/swagger';
import type { ActionSuccessWebResponse } from '@volontariapp/contracts';

export class DeleteTagResponseDTO implements ActionSuccessWebResponse {
  @ApiProperty({ example: true })
  success!: boolean;
}
