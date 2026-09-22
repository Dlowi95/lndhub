import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

function getAllowedOrigins(): string[] {
  const configuredOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (configuredOrigins?.length) return configuredOrigins;
  if (process.env.NODE_ENV === 'production') return [];
  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
  if (trustProxyHops > 0) app.getHttpAdapter().getInstance().set('trust proxy', trustProxyHops);
  app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  }));
  const allowedOrigins = getAllowedOrigins();

  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    logger.warn('CORS_ORIGINS is empty; browser requests from a frontend domain will be blocked');
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, allowedOrigins.includes(origin.replace(/\/$/, '')));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    stopAtFirstError: false,
  }));
  app.enableShutdownHooks();
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  const port = Number(process.env.PORT || 4000);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  logger.log(`LNDHub backend listening on ${host}:${port}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
