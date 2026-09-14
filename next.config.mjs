import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  devIndicators: false,
}

// Fase 1: solo instrumentación de errores. Sin authToken/org/project no se suben
// source maps (se pueden activar en Vercel más adelante). DSN por NEXT_PUBLIC_SENTRY_DSN.
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
})
