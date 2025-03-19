import { z } from 'zod';
import dotenv from 'dotenv';

const configSchema = z.object({
  AI_API_ENDPOINT: z.string().url(),
  AI_API_TOKEN: z.string().min(1),
  UPLOAD_DIR: z.string(),
  MAX_FILE_SIZE: z.number(),
  PORT: z.number().default(3000),
});

dotenv.config();

export const config = configSchema.parse({
  AI_API_ENDPOINT: process.env.AI_API_ENDPOINT,
  AI_API_TOKEN: process.env.AI_API_TOKEN,
  UPLOAD_DIR: process.env.UPLOAD_DIR || './files',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  PORT: parseInt(process.env.PORT || '3000'),
}); 