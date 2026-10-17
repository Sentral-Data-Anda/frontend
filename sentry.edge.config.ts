import * as Sentry from "@sentry/nextjs";

// Edge runtime (middleware/proxy + route edge). Sama seperti server: tanpa DSN,
// SDK non-aktif dan tidak ada traffic keluar.
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT ?? "staging",
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate: 0.1,
});
