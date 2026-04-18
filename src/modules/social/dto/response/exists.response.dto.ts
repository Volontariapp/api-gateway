import { ApiProperty } from '@nestjs/swagger';
import { GetUserNodeWebResponse } from '@volontariapp/contracts';

export class ExistsResponseDTO implements GetUserNodeWebResponse {
  @ApiProperty({ example: true })
  exists!: boolean;
}
