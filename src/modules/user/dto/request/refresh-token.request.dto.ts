import { ApiProperty } from '@nestjs/swagger';
import { RefreshTokenRequest } from '@volontariapp/contracts';
import { RefreshTokenCommand } from '@volontariapp/contracts-nest';

export class RefreshTokenRequestDTO implements RefreshTokenRequest {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiJ9...' })
  refreshToken!: string;

  toCommand(): RefreshTokenCommand {
    return { refreshToken: this.refreshToken };
  }
}
