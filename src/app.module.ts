import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppConfigModule } from './config/app-config.module.js';
import type { CustomConfig } from './config/base-config.js';
import { GrpcClientModule } from './grpc/grpc-client.module.js';
import { UserModule } from './modules/user/user.module.js';
import { PostModule } from './modules/post/post.module.js';
import { EventModule } from './modules/event/event.module.js';
import { SocialModule } from './modules/social/social.module.js';
import { AuthModule, GrpcInternalInterceptor } from '@volontariapp/auth';
import { HelperModule } from './modules/helper/helper.module.js';
import { NodeEnv } from '@volontariapp/config';
import { HealthModule } from '@volontariapp/health-check-nest';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [GrpcClientModule, UserModule, PostModule, EventModule, SocialModule],
})
export class AppModule {
  static register(config: CustomConfig): DynamicModule {
    const imports: DynamicModule['imports'] = [
      AppConfigModule.forRoot(config),
      AuthModule.registerGateway(config.auth),
      TerminusModule.forRoot({}),
      HealthModule.register({
        databases: [],
        failOnMissingProvider: true,
      }),
      GrpcClientModule,
      UserModule,
      PostModule,
      EventModule,
      SocialModule,
    ];

    if (config.nodeEnv !== NodeEnv.PRODUCTION) {
      imports.push(HelperModule);
    }

    return {
      module: AppModule,
      imports,
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: GrpcInternalInterceptor,
        },
      ],
    };
  }
}
