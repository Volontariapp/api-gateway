import { ApiProperty } from '@nestjs/swagger';
import { AuthWebResponse } from '@volontariapp/contracts';

export class AuthResponseDTO implements AuthWebResponse {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiJ9...' })
  refreshToken!: string;
}
