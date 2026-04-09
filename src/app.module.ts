import { DynamicModule, Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module.js';
import type { CustomConfig } from './config/base-config.js';
import { GrpcClientModule } from './grpc/grpc-client.module.js';
import { UserModule } from './modules/user/user.module.js';
import { PostModule } from './modules/post/post.module.js';
import { EventModule } from './modules/event/event.module.js';

@Module({
  imports: [GrpcClientModule, UserModule, PostModule, EventModule],
})
export class AppModule {
  static register(config: CustomConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        AppConfigModule.forRoot(config),
        GrpcClientModule,
        UserModule,
        PostModule,
        EventModule,
      ],
    };
  }
}
