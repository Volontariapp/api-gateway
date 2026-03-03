import './tracing.js';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GrpcToHttpExceptionFilter } from './common/filters/grpc-to-http-exception.filter.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('VolontariApp API Gateway')
    .setDescription('The main entry point for the VolontariApp microservices')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new GrpcToHttpExceptionFilter(),
  );
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(
    '=================================== API Gateway ===================================',
  );
  Logger.log(`SWAGGER: http://localhost:${port}/api`);
  Logger.log(
    '=================================== API Gateway ===================================',
  );
}
void bootstrap();
