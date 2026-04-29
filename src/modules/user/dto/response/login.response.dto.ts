import { ApiProperty } from '@nestjs/swagger';
import { LoginResponse } from '@volontariapp/contracts-nest';
import { AuthResponseDTO } from './auth.response.dto.js';

export class LoginResponseDTO {
  static fromResponse(res: LoginResponse): LoginResponseDTO {
    const dto = new LoginResponseDTO();
    if (res.auth) {
      dto.auth = res.auth as AuthResponseDTO;
    }
    return dto;
  }

  @ApiProperty({ type: AuthResponseDTO })
  auth!: AuthResponseDTO;
}
