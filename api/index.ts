import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import {
  ValidationPipe,
  VersioningType,
  ClassSerializerInterceptor,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser = require('cookie-parser');

const server = express();
let isInitialized = false;

async function bootstrapServer() {
  if (!isInitialized) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    // Enable CORS
    app.enableCors({
      origin: '*',
      credentials: true,
    });

    app.use(cookieParser());

    // API Prefix
    app.setGlobalPrefix('api/m5');

    // API Versioning
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    // Validation Pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: (errors) => {
          const fields: Record<string, string> = {};
          for (const err of errors) {
            if (err.constraints) {
              fields[err.property] = Object.values(err.constraints)[0];
            }
          }
          return new HttpException(
            {
              code: 'VALIDATION_ERROR',
              message: 'Isian tidak lolos validasi',
              fields,
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        },
      }),
    );

    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    // Swagger UI setup with CDN assets (for Vercel serverless)
    const config = new DocumentBuilder()
      .setTitle('API Modul M5 - Katalog & Keranjang Belanja')
      .setDescription('Araya Business Hub Platform - Modul M5 API Documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT dari Modul M1',
        },
        'bearerAuth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          in: 'header',
          name: 'X-Service-Key',
          description: 'Kunci modul untuk komunikasi antarmodul',
        },
        'serviceKey',
      )
      .addTag('Catalog', 'Katalog publik unit usaha dan produk (M5-US1, M5-US5)')
      .addTag('Cart', 'Keranjang belanja dan checkout ke M4 (M5-US3, M5-US4)')
      .addTag('Service Requests', 'Formulir permintaan layanan ke unit usaha (M5-US2)')
      .addTag('Events', 'Webhook penerima event antarmodul (Bab 5)')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/m5/v1/docs', app, document, {
      customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
      ],
      swaggerOptions: {
        persistAuthorization: true,
        defaultModelsExpandDepth: -1,
      },
    });

    await app.init();
    isInitialized = true;
  }

  return server;
}

export default async function handler(req: Request, res: Response) {
  const appInstance = await bootstrapServer();
  return appInstance(req, res);
}

