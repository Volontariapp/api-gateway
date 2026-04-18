import { ApiProperty } from '@nestjs/swagger';

import { User, Badge } from '@volontariapp/contracts';

export class UserDTO implements User {
  @ApiProperty({ example: 'uuid-123' })
  id!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiProperty({ example: 'john_doe' })
  pseudo!: string;

  @ApiProperty({ example: 'USER' })
  role!: string;

  @ApiProperty({ example: 100 })
  totalImpactScore!: number;

  @ApiProperty({ example: [] })
  badges!: Badge[];

  @ApiProperty({ example: 'My bio', required: false })
  bio?: string;

  @ApiProperty({ example: '/path/to/logo', required: false })
  logoPath?: string;
}
