import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  ProductEntity,
  ProductImageEntity,
  StockBatchEntity,
  StockUnitEntity,
  VariantEntity,
} from './generated/nestjs-dto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1', {
    exclude: ['docs', 'docs-json', 'docs-yaml'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const swagger = new DocumentBuilder()
    .setTitle('Tabasamu API')
    .setDescription(
      'Lean ecommerce API. Prisma schema is the model source of truth — Nest DTO/Entity classes are generated for Swagger. Admin routes use header `X-Admin-Api-Key`.',
    )
    .setVersion('0.1')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Admin-Api-Key',
        in: 'header',
        description: 'Same value as backend ADMIN_API_KEY',
      },
      'admin-api-key',
    )
    .addServer(`http://localhost:${process.env.PORT ?? 3001}`, 'Local')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swagger, {
      extraModels: [
        ProductEntity,
        VariantEntity,
        ProductImageEntity,
        StockBatchEntity,
        StockUnitEntity,
      ],
    });
  SwaggerModule.setup('docs', app, documentFactory, {
    jsonDocumentUrl: 'docs-json',
    yamlDocumentUrl: 'docs-yaml',
  });

  // 3001 avoids clash with Next (3000) and Medusa (9000).
  // Bind 0.0.0.0 so Docker Compose can reach the API from other services.
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
