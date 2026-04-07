import { DynamicModule, Global, Module } from '@nestjs/common';
import type { BaseConfig } from '@volontariapp/config';
import { APP_CONFIG } from './app-config.constants.js';
import { AppConfigService } from './app-config.service.js';

@Global()
@Module({
  providers: [],
  exports: [],
})
export class AppConfigModule {
  static forRoot(config: BaseConfig): DynamicModule {
    return {
      module: AppConfigModule,
      providers: [
        {
          provide: APP_CONFIG,
          useValue: config,
        },
        {
          provide: AppConfigService,
          useFactory: (appConfig: BaseConfig) =>
            new AppConfigService(appConfig),
          inject: [APP_CONFIG],
        },
      ],
      exports: [APP_CONFIG, AppConfigService],
      global: true,
    };
  }
}
