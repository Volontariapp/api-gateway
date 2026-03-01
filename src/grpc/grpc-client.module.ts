import { Global, Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { grpcClientOptions } from './grpc-client.options.js';

@Global()
@Module({
  imports: [ClientsModule.registerAsync(grpcClientOptions)],
  exports: [ClientsModule],
})
export class GrpcClientModule {}
