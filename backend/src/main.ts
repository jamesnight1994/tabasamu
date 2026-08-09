import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
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
  // 3001 avoids clash with Next (3000) and Medusa (9000).
  // Bind 0.0.0.0 so Docker Compose can reach the API from other services.
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
