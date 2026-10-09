import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  app.enableCors({
    origin: [
      clientUrl,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 5000;

  await app.listen(port);

  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
