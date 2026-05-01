import { BaseConfig, GatewayAuthConfig, MSURLsConfig } from '@volontariapp/config';
import { Type } from 'class-transformer';
import { IsDefined, ValidateNested, IsNumber, IsOptional, IsString } from 'class-validator';

export class ExtendedAuthConfig extends GatewayAuthConfig {
  @IsOptional()
  @IsString()
  accessTokenPrivateKeyPath?: string;

  @IsOptional()
  @IsString()
  refreshTokenPrivateKeyPath?: string;

  @IsOptional()
  @IsString()
  accessTokenExpiresIn?: string | number;

  @IsOptional()
  @IsString()
  refreshTokenExpiresIn?: string | number;
}

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
  @Type(() => ExtendedAuthConfig)
  auth!: ExtendedAuthConfig;
}
