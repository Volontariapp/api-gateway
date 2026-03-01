import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module.js';
import { GrpcClientModule } from './grpc/grpc-client.module.js';
import { UserModule } from './modules/user/user.module.js';
import { PostModule } from './modules/post/post.module.js';
import { EventModule } from './modules/event/event.module.js';

@Module({
  imports: [
    AppConfigModule,
    GrpcClientModule,
    UserModule,
    PostModule,
    EventModule,
  ],
})
export class AppModule {}
