import { ApiProperty } from '@nestjs/swagger';
import { SignUpRequest } from '@volontariapp/contracts';
import { SignUpCommand } from '@volontariapp/contracts-nest';
import { OrganisationInfoDTO } from '../common/user.dto.js';

export class SignUpRequestDTO implements SignUpRequest {
  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiProperty({ example: 'john_doe' })
  pseudo!: string;

  @ApiProperty({ example: 'strongPassword123' })
  password!: string;

  @ApiProperty({ required: false, example: 'My bio' })
  bio?: string;

  @ApiProperty({ required: false, example: '+33612345678' })
  phone?: string;

  @ApiProperty({ required: false, example: '/path/to/logo' })
  logoPath?: string;

  @ApiProperty({ required: false, type: OrganisationInfoDTO })
  organisationInfo?: OrganisationInfoDTO;

  toCommand(): SignUpCommand {
    return {
      email: this.email,
      pseudo: this.pseudo,
      password: this.password,
      bio: this.bio,
      phone: this.phone,
      logoPath: this.logoPath,
      organisationInfo: this.organisationInfo,
    };
  }
}
