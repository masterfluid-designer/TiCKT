import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import { config } from './infrastructure/config/env';
import { connectDatabase, disconnectDatabase } from './infrastructure/database/prisma/client';

// Import logger
import pino from 'pino';

export const logger = pino({
  level: config.log.level,
  transport: config.app.isDev
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

async function bootstrap(): Promise<void> {
  // Connexion DB
  await connectDatabase();

  const app = express();

  // ── Security middleware ───────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({
    origin: config.cors.origins,
    credentials: true,
  }));

  // ── Parsing ───────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(compression());

  // ── HTTP Logging ──────────────────────────────────────────────────────────
  app.use(pinoHttp({
    logger,
    // Ne pas logger les health checks
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  }));

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: config.app.env,
      version: process.env['npm_package_version'] ?? '1.0.0',
    });
  });

  // ── Routes API ────────────────────────────────────────────────────────────
  // Les routes seront importées ici au fur et à mesure
  // app.use('/api/v1/auth', authRouter);
  // app.use('/api/v1/events', eventsRouter);
  // app.use('/api/v1/tickets', ticketsRouter);
  // app.use('/api/v1/checkin', checkinRouter);
  // app.use('/t', ticketPageRouter);

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // ── Global error handler ──────────────────────────────────────────────────
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({
      error: config.app.isDev ? err.message : 'Internal Server Error',
    });
  });

  // ── Start ─────────────────────────────────────────────────────────────────
  const server = app.listen(config.app.port, () => {
    logger.info(`🚀 Server running on port ${config.app.port} [${config.app.env}]`);
    logger.info(`📖 Docs: ${config.app.url}/api/docs`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});
