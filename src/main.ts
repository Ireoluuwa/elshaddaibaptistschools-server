import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

let isInitialized = false;

async function bootstrap() {
  if (isInitialized) return;

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
  const allowedOrigins = [
    process.env.LOCAL_FRONTEND_URL,
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  // Automatically add www version for production domains
  const expandedOrigins = [...allowedOrigins];
  allowedOrigins.forEach((origin) => {
    if (origin.includes('https://') && !origin.includes('www.')) {
      expandedOrigins.push(origin.replace('https://', 'https://www.'));
    }
  });

  app.enableCors({
    origin: (origin, callback) => {
      const isAllowed = !origin || expandedOrigins.some(
        (o) => o.replace(/\/$/, '') === origin.replace(/\/$/, ''),
      );
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  await app.init();
  isInitialized = true;
}

// Local development
if (!process.env.VERCEL) {
  bootstrap().then(() => {
    const port = process.env.PORT ?? 3000;
    server.listen(port, () => {
      console.log(`Application is running on: http://localhost:${port}/api`);
    });
  });
}

// Vercel serverless handler
export default async (req: any, res: any) => {
  await bootstrap();
  server(req, res);
};
