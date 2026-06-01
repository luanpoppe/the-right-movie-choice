import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["dev", "prod", "test"]),
  PORT: z.coerce.number().default(3333),
  REDIS_URL: z.string(),
  DATABASE_URL: z.string().min(1),
  GEMINI_API_KEY: z.string(),

  JWT_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().default(604800), // 7 days
  REFRESH_COOKIE_NAME: z.string().default("refreshToken"),
  COOKIE_SECRET: z.string().min(1),
});

const result = envSchema.safeParse(process.env);

if (!result.success)
  throw new Error(JSON.stringify(z.treeifyError(result.error), undefined, 2));

export const env = result.data;
