import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: configService.get('app.corsOrigin'),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get('app.port') || 3000;
  await app.listen(port);

  console.log(
    `🚀 CookBook Connect API is running on: http://localhost:${port}`,
  );
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
}
bootstrap();
