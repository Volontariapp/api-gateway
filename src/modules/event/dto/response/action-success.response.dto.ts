import { ApiProperty } from '@nestjs/swagger';
import { ActionSuccessWebResponse } from '@volontariapp/contracts';

export class ActionSuccessResponseDTO implements ActionSuccessWebResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Operation completed successfully', required: false })
  message?: string;
}
