import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { GrpcClientModule } from './grpc/grpc-client.module';
import { UserModule } from './modules/user/user.module';
import { PostModule } from './modules/post/post.module';
import { EventModule } from './modules/event/event.module';

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
