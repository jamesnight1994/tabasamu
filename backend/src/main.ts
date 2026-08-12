import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

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
      'Lean ecommerce API (Phase 1: product management). Admin routes use header `X-Admin-Api-Key` (no User login yet).',
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

  const documentFactory = () => SwaggerModule.createDocument(app, swagger);
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
