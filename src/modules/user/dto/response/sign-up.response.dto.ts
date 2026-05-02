import { ApiProperty } from '@nestjs/swagger';
import { SignUpWebResponse } from '@volontariapp/contracts';
import { SignUpResponse } from '@volontariapp/contracts-nest';
import { UserDTO } from '../common/user.dto.js';
import { AuthResponseDTO } from './auth.response.dto.js';

export class SignUpResponseDTO implements SignUpWebResponse {
  static fromResponse(res: SignUpResponse): SignUpResponseDTO {
    const dto = new SignUpResponseDTO();
    if (res.user) {
      dto.user = UserDTO.fromUser(res.user);
    }
    if (res.auth) {
      dto.auth = res.auth as AuthResponseDTO;
    }
    return dto;
  }

  @ApiProperty({ type: UserDTO })
  user!: UserDTO;

  @ApiProperty({ type: AuthResponseDTO })
  auth!: AuthResponseDTO;
}
