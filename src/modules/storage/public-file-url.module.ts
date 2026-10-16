import { Global, Module } from '@nestjs/common';
import { PublicFileUrlService } from './public-file-url.service.js';

@Global()
@Module({
  providers: [PublicFileUrlService],
  exports: [PublicFileUrlService],
})
export class PublicFileUrlModule {}
