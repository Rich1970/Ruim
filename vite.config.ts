import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { stripeDev } from './server/stripe-dev.mjs'
import { emailDev } from './server/email-dev.mjs'
import { aggregatorDev } from './server/aggregator-dev.mjs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      // Dev-only adapters over the shared server/handlers.mjs. In production the
      // same handlers run as serverless functions (see api/**). They read the
      // secrets from `env` (loadEnv) here, and from process.env in serverless.
      stripeDev(env),
      emailDev(env),
      aggregatorDev(env),
    ],
    server: {
      host: true,
      port: 5178,
      // Allow access via public tunnel hostnames (e.g. *.trycloudflare.com) so the
      // running app can be shared for viewing & testing.
      allowedHosts: true,
      proxy: {
        // Same-origin proxy to the Transitous / MOTIS open journey-planning API.
        '/motis': {
          target: 'https://api.transitous.org',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/motis/, ''),
        },
      },
    },
  }
})
