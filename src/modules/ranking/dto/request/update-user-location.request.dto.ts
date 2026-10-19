import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude } from 'class-validator';
import type { UpdateUserLocationCommand } from '@volontariapp/contracts-nest';
import type { UpdateUserLocationWebRequest } from '@volontariapp/contracts';

export class UpdateUserLocationRequestDTO implements UpdateUserLocationWebRequest {
  @ApiProperty({ example: 48.8566, minimum: -90, maximum: 90 })
  @IsLatitude()
  lat!: number;

  @ApiProperty({ example: 2.3522, minimum: -180, maximum: 180 })
  @IsLongitude()
  lng!: number;

  toCommand(): UpdateUserLocationCommand {
    return { lat: this.lat, lng: this.lng };
  }
}
