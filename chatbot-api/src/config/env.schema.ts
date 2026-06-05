import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  JWT_SIGNING_KEY: z.string().min(1),
  JWT_VERIFYING_KEY: z.string().min(1),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  OPENWA_BASE_URL: z.string().url(),
  OPENWA_API_KEY: z.string().min(1),
  OPENWA_WEBHOOK_SECRET: z.string().min(16),
  OPENWA_WEBHOOK_URL: z.string().url(),

  MP_ACCESS_TOKEN: z.string().min(1),
  MP_WEBHOOK_SECRET: z.string().min(1),
  MP_PUBLIC_KEY: z.string().optional(),

  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_BUCKET: z.string().default('converxa-media'),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),
  SMTP_FROM: z.string().email(),

  SENTRY_DSN: z.string().url().optional(),
  WEB_ORIGINS: z
    .string()
    .default('http://localhost:3001')
    .transform((s) => s.split(',')),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${errors}`);
  }
  return result.data;
}
