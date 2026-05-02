import { ApiProperty } from '@nestjs/swagger';
import { LoginWebResponse } from '@volontariapp/contracts';
import { LoginResponse } from '@volontariapp/contracts-nest';
import { AuthResponseDTO } from './auth.response.dto.js';

export class LoginResponseDTO implements LoginWebResponse {
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
