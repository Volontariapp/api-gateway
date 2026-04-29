import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from '@volontariapp/contracts-nest';
import { UserDTO } from '../common/user.dto.js';

export class UserResponseDTO {
  static fromResponse(res: UserResponse): UserResponseDTO {
    const dto = new UserResponseDTO();
    if (res.user) {
      dto.user = UserDTO.fromUser(res.user);
    }
    return dto;
  }

  @ApiProperty({ type: UserDTO })
  user!: UserDTO;
}
