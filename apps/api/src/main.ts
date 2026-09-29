import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
} from '@nestjs/common';

import {
  AppModule,
  ObserveInstrument,
} from './app.module.js';

import {
  HttpExceptionFilter,
} from './common/filters/http-exception.filter.js';

import {
  ResponseInterceptor,
} from './common/interceptors/response.interceptor.js';

import {
  LoggingInterceptor,
} from './common/interceptors/logging.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  /*
   * CORS is environment-driven.
   *
   * Development:
   *   CORS_ORIGIN=http://localhost:3001
   *
   * Production:
   *   CORS_ORIGIN=https://your-domain.com
   *
   * Keeping this outside the source code allows the same
   * Docker image to be deployed to different environments.
   */
  const corsOrigin = process.env.CORS_ORIGIN;

  if (!corsOrigin) {
    throw new Error(
      'CORS_ORIGIN environment variable is required',
    );
  }

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  /*
   * Global request validation.
   *
   * whitelist removes properties that are not defined
   * in DTOs, while forbidNonWhitelisted rejects requests
   * containing unexpected properties.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new LoggingInterceptor(),
  );

  const port = Number(
    process.env.PORT ?? 3000,
  );

  await app.listen(port);
}

await bootstrap();