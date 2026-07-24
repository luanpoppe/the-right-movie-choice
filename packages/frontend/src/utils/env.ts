import z from "zod";

const envSchema = z.object({
  VITE_NODE_ENV: z.enum(["local", "prod", "test"]).default("local"),
  VITE_BACKEND_URL: z.string().default(""),
  VITE_GOOGLE_CLIENT_ID: z.string().min(1),
});

const { success, error, data } = envSchema.safeParse(import.meta.env);
if (!success)
  throw new Error(JSON.stringify(z.treeifyError(error), undefined, 2));

export const env = data;
