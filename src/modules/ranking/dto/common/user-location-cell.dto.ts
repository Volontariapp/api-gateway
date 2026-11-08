import { ApiProperty } from '@nestjs/swagger';
import type { UserLocationCell } from '@volontariapp/contracts-nest';

/** A position rounded to about 1 km. It belongs to no one: there is no user identifier. */
export class UserLocationCellDTO implements UserLocationCell {
  @ApiProperty({ example: 48.857, minimum: -90, maximum: 90 })
  lat!: number;

  @ApiProperty({ example: 2.352, minimum: -180, maximum: 180 })
  lng!: number;
}
