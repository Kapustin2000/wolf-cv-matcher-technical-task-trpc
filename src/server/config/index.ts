import { z } from 'zod';
import dotenv from 'dotenv';

const configSchema = z.object({
  // AI Service
  AI_API_ENDPOINT: z.string().url(),
  AI_API_TOKEN: z.string().min(1),

  // Rate Limiting
  MAX_REQUESTS_PER_MINUTE: z.number().default(20),
  MAX_REQUESTS_PER_HOUR: z.number().default(300),
  MINUTE_IN_MS: z.number().default(60 * 1000),
  HOUR_IN_MS: z.number().default(60 * 60 * 1000),

  // Server
  PORT: z.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

dotenv.config();

export const config = configSchema.parse({
  // AI Service
  AI_API_ENDPOINT: process.env.AI_API_ENDPOINT,
  AI_API_TOKEN: process.env.AI_API_TOKEN,

  // Rate Limiting
  MAX_REQUESTS_PER_MINUTE: Number(process.env.MAX_REQUESTS_PER_MINUTE) || 20,
  MAX_REQUESTS_PER_HOUR: Number(process.env.MAX_REQUESTS_PER_HOUR) || 300,
  MINUTE_IN_MS: 60 * 1000,
  HOUR_IN_MS: 60 * 60 * 1000,

  // Server
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
}); 