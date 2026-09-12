import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const RuntimeEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3100),
  OLLM_VERSION: z.string().default('0.2.0'),
  OLLM_MODEL_ID: z.string().min(1).default('onegodian-llm'),
  OLLM_API_KEY: z.string().default(''),
  OLLM_BACKEND_URL: z.string().url().optional(),
  OLLM_BACKEND_MODEL: z.string().min(1).optional(),
  OLLM_BACKEND_API_KEY: z.string().optional(),
  OLLM_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().max(120000).default(30000)
}).superRefine((value, ctx) => {
  if (value.NODE_ENV !== 'production') return;
  if (value.OLLM_API_KEY.trim().length < 24) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['OLLM_API_KEY'], message: 'Production requires an OLLM API key with at least 24 characters.' });
  }
  if (!value.OLLM_BACKEND_URL) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['OLLM_BACKEND_URL'], message: 'Production requires a configured model backend.' });
  }
  if (!value.OLLM_BACKEND_MODEL) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['OLLM_BACKEND_MODEL'], message: 'Production requires an explicit backend model.' });
  }
});

export const runtimeConfig = RuntimeEnv.parse(process.env);
