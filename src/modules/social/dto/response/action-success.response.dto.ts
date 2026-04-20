import { ApiProperty } from '@nestjs/swagger';
import { PostFollowUserWebResponse } from '@volontariapp/contracts';

export class ActionSuccessResponseDTO implements PostFollowUserWebResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;
}
