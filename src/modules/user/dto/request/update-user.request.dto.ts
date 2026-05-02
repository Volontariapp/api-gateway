import { ApiProperty } from '@nestjs/swagger';
import { UpdateUserRequest } from '@volontariapp/contracts';
import { UpdateUserCommand } from '@volontariapp/contracts-nest';
import { OrganisationInfoDTO } from '../common/user.dto.js';

export class UpdateUserRequestDTO implements UpdateUserRequest {
  id!: string;

  @ApiProperty({ required: false, example: 'john.doe@example.com' })
  email?: string;

  @ApiProperty({ required: false, example: 'john_doe' })
  pseudo?: string;

  @ApiProperty({ required: false, example: 'My bio' })
  bio?: string;

  @ApiProperty({ required: false, example: '/path/to/logo' })
  logoPath?: string;

  @ApiProperty({ required: false, example: '+33612345678' })
  phone?: string;

  @ApiProperty({ required: false, example: 'currentPassword123' })
  previousPassword?: string;

  @ApiProperty({ required: false, example: 'newPassword456' })
  newPassword?: string;

  @ApiProperty({ required: false, type: OrganisationInfoDTO })
  organisationInfo?: OrganisationInfoDTO;

  toCommand(): UpdateUserCommand {
    return {
      userId: this.id,
      email: this.email,
      pseudo: this.pseudo,
      bio: this.bio,
      logoPath: this.logoPath,
      phone: this.phone,
      previousPassword: this.previousPassword,
      newPassword: this.newPassword,
      organisationInfo: this.organisationInfo,
    };
  }
}
