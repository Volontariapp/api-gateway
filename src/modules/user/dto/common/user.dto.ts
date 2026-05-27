import { ApiProperty } from '@nestjs/swagger';
import { User, UserPublic } from '@volontariapp/contracts-nest';
import { BadgeDTO } from './badge.dto.js';

export class OrganisationInfoDTO {
  @ApiProperty({ example: 'W123456789' })
  rna!: string;
}

export class UserPublicDTO {
  @ApiProperty({ example: 'uuid-123' })
  id!: string;

  @ApiProperty({ example: 'john_doe' })
  pseudo!: string;

  @ApiProperty({ example: 100 })
  totalImpactScore!: number;

  @ApiProperty({ type: [BadgeDTO] })
  badges!: BadgeDTO[];

  @ApiProperty({ required: false, example: 'My bio' })
  bio?: string;

  @ApiProperty({ required: false, example: '/path/to/logo' })
  logoPath?: string;

  @ApiProperty({ required: false, type: OrganisationInfoDTO })
  organisationInfo?: OrganisationInfoDTO;

  static fromUserPublic(user: UserPublic): UserPublicDTO {
    const dto = new UserPublicDTO();
    dto.id = user.id;
    dto.pseudo = user.pseudo;
    dto.totalImpactScore = user.totalImpactScore;
    dto.bio = user.bio;
    dto.logoPath = user.logoPath;
    dto.organisationInfo = user.organisationInfo;
    dto.badges = user.badges.map((b) => BadgeDTO.fromBadge(b));
    return dto;
  }
}

export class UserDTO extends UserPublicDTO {
  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiProperty({ example: 'USER' })
  role!: string;

  static fromUser(user: User): UserDTO {
    const dto = new UserDTO();
    dto.id = user.id;
    dto.email = user.email;
    dto.pseudo = user.pseudo;
    dto.role = user.role;
    dto.totalImpactScore = user.totalImpactScore;
    dto.bio = user.bio;
    dto.logoPath = user.logoPath;
    dto.organisationInfo = user.organisationInfo;
    dto.badges = user.badges.map((b) => BadgeDTO.fromBadge(b));
    return dto;
  }
}
