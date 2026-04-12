import { ApiProperty } from '@nestjs/swagger';
import { GetUserResponse } from '@volontariapp/contracts-nest';
import { UserWebResponse } from '@volontariapp/contracts';
import { UserDTO } from '../common/user.dto.js';

export class UserResponseDTO implements GetUserResponse, UserWebResponse {
  @ApiProperty({ type: UserDTO })
  user!: UserDTO;
}
