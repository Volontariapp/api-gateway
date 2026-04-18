import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from '@volontariapp/contracts-nest';
import { UserWebResponse } from '@volontariapp/contracts';
import { UserDTO } from '../common/user.dto.js';

export class UserResponseDTO implements UserResponse, UserWebResponse {
  @ApiProperty({ type: UserDTO })
  user!: UserDTO;
}
