import { PrismaClient } from '@prisma/client';
import { config } from '../config/env';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma — évite les connexions multiples en dev (hot reload)
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: config.app.isDev
      ? [
          { level: 'query', emit: 'event' },
          { level: 'warn', emit: 'stdout' },
          { level: 'error', emit: 'stdout' },
        ]
      : [
          { level: 'warn', emit: 'stdout' },
          { level: 'error', emit: 'stdout' },
        ],
  });
}

export const prisma: PrismaClient =
  global.__prisma ?? createPrismaClient();

if (config.app.isDev) {
  global.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  console.log('✅ Database connected');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('📴 Database disconnected');
}
