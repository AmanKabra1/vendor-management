import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { seedAdmin } from '../src/seed';

// Vercel serverless entry. Instead of app.listen(), we boot Nest once per
// container, init it, and hand the underlying Express instance the request.
// The promise is cached so concurrent invocations share one bootstrap.
let serverPromise: Promise<any> | null = null;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Vendor Management API')
    .setDescription('APIs for vendors, POs, and performance metrics')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  // Idempotent: only creates the admin if missing.
  await seedAdmin(app);
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: any, res: any) {
  if (!serverPromise) serverPromise = bootstrap();
  const server = await serverPromise;
  return server(req, res);
}
