import { ApiProperty } from '@nestjs/swagger';
import { RefreshTokenCommand } from '@volontariapp/contracts-nest';

export class RefreshTokenRequestDTO {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiJ9...' })
  refreshToken!: string;

  toCommand(): RefreshTokenCommand {
    return { refreshToken: this.refreshToken };
  }
}
