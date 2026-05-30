import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_URL: z.string().url(),
  TICKET_BASE_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  KKIAPAY_PUBLIC_KEY: z.string().default(''),
  KKIAPAY_PRIVATE_KEY: z.string().default(''),
  KKIAPAY_SECRET_KEY: z.string().default(''),
  KKIAPAY_SANDBOX: z.coerce.boolean().default(true),
  KKIAPAY_WEBHOOK_SECRET: z.string().default(''),

  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('TicketFlow <noreply@ticketflow.com>'),

  WHATSAPP_API_URL: z.string().default(''),
  WHATSAPP_TOKEN: z.string().default(''),
  WHATSAPP_PHONE_ID: z.string().default(''),

  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_BUCKET: z.string().optional(),
  AWS_ENDPOINT: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
}

// Singleton — chargé une seule fois au démarrage
export const env = loadEnv();

export const config = {
  app: {
    env: env.NODE_ENV,
    port: env.PORT,
    url: env.APP_URL,
    ticketBaseUrl: env.TICKET_BASE_URL,
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
  },
  db: {
    url: env.DATABASE_URL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  kkiapay: {
    publicKey: env.KKIAPAY_PUBLIC_KEY,
    privateKey: env.KKIAPAY_PRIVATE_KEY,
    secretKey: env.KKIAPAY_SECRET_KEY,
    sandbox: env.KKIAPAY_SANDBOX,
    webhookSecret: env.KKIAPAY_WEBHOOK_SECRET,
    baseUrl: env.KKIAPAY_SANDBOX
      ? 'https://api-sandbox.kkiapay.me'
      : 'https://api.kkiapay.me',
  },
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.EMAIL_FROM,
  },
  whatsapp: {
    apiUrl: env.WHATSAPP_API_URL,
    token: env.WHATSAPP_TOKEN,
    phoneId: env.WHATSAPP_PHONE_ID,
  },
  storage: {
    provider: env.STORAGE_PROVIDER,
    s3: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
      bucket: env.AWS_BUCKET,
      endpoint: env.AWS_ENDPOINT,
    },
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
  },
  cors: {
    origins: env.CORS_ORIGINS.split(',').map(o => o.trim()),
  },
  log: {
    level: env.LOG_LEVEL,
  },
} as const;
