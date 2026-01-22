import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const messages = errors
          .map((error) => Object.values(error.constraints || {}))
          .flat()
          .join('; ');

        return new BadRequestException(messages);
      },
      stopAtFirstError: false,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
