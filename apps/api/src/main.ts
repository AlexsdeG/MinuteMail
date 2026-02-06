import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // Security & Validation
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: corsOrigins ? corsOrigins.split(',').map(origin => origin.trim()) : true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties not in DTO
    transform: true,
  }));
  
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();