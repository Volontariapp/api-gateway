import {
  BaseConfig,
  GatewayAuthConfig,
  MSURLsConfig,
} from '@volontariapp/config';
import { Type } from 'class-transformer';
import { IsDefined, ValidateNested, IsNumber } from 'class-validator';

export class CustomConfig extends BaseConfig {
  @IsDefined()
  @Type(() => Number)
  @IsNumber()
  declare port: number;

  @IsDefined()
  @ValidateNested()
  @Type(() => MSURLsConfig)
  microServices!: MSURLsConfig;

  @IsDefined()
  @ValidateNested()
  @Type(() => GatewayAuthConfig)
  auth!: GatewayAuthConfig;
}
