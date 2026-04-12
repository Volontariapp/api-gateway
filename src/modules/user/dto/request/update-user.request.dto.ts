import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { UpdateUserCommand } from '@volontariapp/contracts-nest';
import { UpdateUserRequest } from '@volontariapp/contracts';
import { CreateUserRequestDTO } from './create-user.request.dto.js';

export class UpdateUserRequestDTO
  extends PartialType(OmitType(CreateUserRequestDTO, ['toCommand'] as const))
  implements UpdateUserRequest
{
  @ApiProperty({ example: 'uuid-123' })
  id!: string;

  toCommand(): UpdateUserCommand {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
    };
  }
}
