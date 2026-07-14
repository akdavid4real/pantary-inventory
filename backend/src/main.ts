import 'reflect-metadata';
import './common/config/load-environment';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { EnvironmentService } from './common/config/environment.service';
import { PrismaAvailabilityFilter } from './common/filters/prisma-availability.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(EnvironmentService);

  const apiPrefix = config.get<string>('API_PREFIX') ?? 'api/v1';
  const frontendUrl = config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

  app.enableCors({
    origin: [
      frontendUrl,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email'],
  });
  app.use(helmet());

  const httpLogger = new Logger('HTTP');
  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();
    response.on('finish', () => {
      const duration = Date.now() - startedAt;
      const timing = JSON.stringify({
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: duration,
        slow: duration >= 2000,
      });
      if (response.statusCode >= 500) httpLogger.error(timing);
      else if (response.statusCode >= 400 || duration >= 2000) httpLogger.warn(timing);
      else httpLogger.log(timing);
    });
    next();
  });

  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new PrismaAvailabilityFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pantry-to-Plate API')
    .setDescription('Backend API powered by the PlateSense Food Engine.')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-user-id', in: 'header' }, 'x-user-id')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  const port = Number(config.get<string>('PORT') ?? 4000);
  await app.listen(port);
}

bootstrap();
