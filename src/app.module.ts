import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppConfigModule } from './config/app-config.module.js';
import type { CustomConfig } from './config/base-config.js';
import { HelperModule } from './modules/helper/helper.module.js';
import { EventModule } from './modules/event/event.module.js';
import { GrpcClientModule } from './grpc/grpc-client.module.js';
import { GrpcInternalInterceptor } from '@volontariapp/auth';
import { PostModule } from './modules/post/post.module.js';
import { SocialModule } from './modules/social/social.module.js';
import { UserModule } from './modules/user/user.module.js';
import { AuthModule } from '@volontariapp/auth';
import { NodeEnv } from '@volontariapp/config';
import { HealthModule } from './modules/health/health.module.js';
import { WsProxyModule } from './modules/ws-proxy/ws-proxy.module.js';
import { SystemModule } from './modules/system/system.module.js';

@Module({
  imports: [
    GrpcClientModule,
    UserModule,
    PostModule,
    EventModule,
    SocialModule,
    WsProxyModule,
    SystemModule,
  ],
})
export class AppModule {
  static register(config: CustomConfig): DynamicModule {
    const imports: DynamicModule['imports'] = [
      AppConfigModule.forRoot(config),
      AuthModule.registerGateway(config.auth),
      GrpcClientModule,
      UserModule,
      PostModule,
      EventModule,
      SocialModule,
      HealthModule,
      WsProxyModule,
      SystemModule,
    ];

    if (config.nodeEnv !== NodeEnv.TEST) {
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
