import * as Sentry from "@sentry/nextjs"

// Error tracking (server runtime). Sin DSN => deshabilitado (no-op).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV,
  tracesSampleRate: 0,
  sendDefaultPii: false,
})
