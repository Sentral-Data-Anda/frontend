import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  API_BASE_URL: z.url(),
});

export const env = serverEnvSchema.parse({
  API_BASE_URL: process.env.API_BASE_URL,
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
