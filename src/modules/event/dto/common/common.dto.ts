import { ApiProperty } from '@nestjs/swagger';
import { Tag, Requirement } from '@volontariapp/contracts-nest';

export class TagDTO implements Tag {
  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  id!: string;

  @ApiProperty({ example: 'tech' })
  slug!: string;

  @ApiProperty({ example: 'Technology' })
  name!: string;

  @ApiProperty({ example: '#FF0000' })
  color!: string;
}

export class RequirementDTO implements Requirement {
  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  id!: string;

  @ApiProperty({ example: 'Volunteers' })
  name!: string;

  @ApiProperty({ example: 'Need people to help setup the room.' })
  description!: string;

  @ApiProperty({ example: 10 })
  neededQuantity!: number;

  @ApiProperty({ example: 2 })
  currentQuantity!: number;
}
