import { clientEnvSchema } from "./env-schema";

export const env = clientEnvSchema.parse({
  VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
  VITE_ENABLE_SW: import.meta.env.VITE_ENABLE_SW,
});
