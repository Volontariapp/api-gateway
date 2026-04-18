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
      userId: this.id,
      email: this.email,
      pseudo: this.pseudo,
      bio: this.bio,
    };
  }
}
