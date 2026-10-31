import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
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
let isAppReady = false;
let bootstrapPromise: Promise<void> | null = null;

// Root info endpoint (so / and /api don't 404)
server.get(['/', '/api'], (req, res) => {
  res.json({
    message: 'Araya Business Hub Platform - Modul M5 API is running',
    version: '1.0.0',
    docs: '/api/m5/v1/docs',
    endpoints: {
      catalog_overview: '/api/m5/v1/catalog/overview',
      catalog_business_units: '/api/m5/v1/catalog/business-units',
      catalog_products: '/api/m5/v1/catalog/products',
      service_requests: '/api/m5/v1/service-requests',
      cart: '/api/m5/v1/cart',
      events: '/api/m5/v1/events',
      health: '/api/m5/v1/health',
    },
  });
});

async function bootstrapServer() {
  if (isAppReady) return;
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

      app.enableCors({
        origin: '*',
        credentials: true,
      });

      app.use(cookieParser());
      app.setGlobalPrefix('api/m5');

      app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
      });

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

      // Swagger Configuration
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
        customCssUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
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
      isAppReady = true;
    })();
  }
  return bootstrapPromise;
}

async function handler(req: any, res: any) {
  try {
    await bootstrapServer();
    server(req, res);
  } catch (err: any) {
    console.error('Vercel Serverless Function Crash:', err);
    if (!res.headersSent) {
      res.status(500).json({
        statusCode: 500,
        message: 'Serverless Function Crash',
        error: err?.message || String(err),
        stack: err?.stack,
      });
    }
  }
}

export default handler;
module.exports = handler;
module.exports.default = handler;
