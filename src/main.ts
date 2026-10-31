import {
  ValidationPipe,
  VersioningType,
  ClassSerializerInterceptor,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Get configurations
  const swaggerEnabled = configService.get<boolean>('swagger.enabled');
  const corsOrigin = configService.get<string>('app.corsOrigin');
  const swaggerPath = configService.get<string>('swagger.path');
  const apiPrefix = configService.get<string>('app.apiPrefix');
  const port = configService.get<number>('app.port');

  // Enable CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe with Bab 4 contract (422 and fields)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
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

  // Class serializer for excluding fields (like password)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger Documentation as per Panduan Bab 7 (/api/m5/v1/docs)
  if (swaggerEnabled) {
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
      swaggerOptions: {
        persistAuthorization: true,
        defaultModelsExpandDepth: -1,
      },
    });
  }

  await app.listen(port);

  console.log(`\n🚀 Application is running on: http://localhost:${port}/`);
  console.log(`🌍 Environment: ${configService.get<string>('app.env')}\n`);
  if (swaggerEnabled) {
    console.log(`📚 Swagger Documentation on : http://localhost:${port}/api/m5/v1/docs`);
  }
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🏓 Ping endpoint: http://localhost:${port}/ping\n`);
}

bootstrap();
