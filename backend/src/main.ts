import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 3001 avoids clash with Next (3000) and Medusa (9000).
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
