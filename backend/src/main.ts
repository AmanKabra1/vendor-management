import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { seedAdmin } from './seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow the Angular dev server (and others) to call the API.
  app.enableCors({ origin: true, credentials: true });

  // Validate/transform incoming DTOs globally.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Vendor Management API')
    .setDescription('APIs for vendors, POs, and performance metrics')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('vendor')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await seedAdmin(app);

  // Cloud hosts (Back4App, Koyeb, Railway…) provide the port via env.
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server started on port ${port}`);
}
bootstrap();
