import { Global, Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { getGrpcOptions } from '@volontariapp/contracts';
import { AppConfigService } from '../config/app-config.service.js';
import { EVENT_PACKAGE, POST_PACKAGE, USER_PACKAGE } from './grpc-packages.js';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: USER_PACKAGE,
        inject: [AppConfigService],
        useFactory: (configService: AppConfigService) =>
          getGrpcOptions('USER', configService.msUserUrl),
      },
      {
        name: POST_PACKAGE,
        inject: [AppConfigService],
        useFactory: (configService: AppConfigService) =>
          getGrpcOptions('POST', configService.msPostUrl),
      },
      {
        name: EVENT_PACKAGE,
        inject: [AppConfigService],
        useFactory: (configService: AppConfigService) =>
          getGrpcOptions('EVENT', configService.msEventUrl),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class GrpcClientModule {}
