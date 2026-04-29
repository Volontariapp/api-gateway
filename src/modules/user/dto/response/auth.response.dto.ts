import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDTO {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiJ9...' })
  refreshToken!: string;
}
