import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import compression from 'compression';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(compression());

  app.enableCors({
    origin: '*',
  });
  app.use(json({ limit: '500mb' }));
  app.use(urlencoded({ extended: true, limit: '500mb' }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
