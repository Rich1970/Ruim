import { stripeConfig, stripeCheckout, stripeStatus } from './handlers.mjs'

// Dev-server adapter: exposes the shared Stripe handlers on /api/stripe/* during
// `vite dev`. In production the SAME handlers run as serverless functions (see
// api/stripe/*.js). The secret key is read server-side and never reaches the browser.

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => { data += c })
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')) } catch (e) { reject(e) } })
    req.on('error', reject)
  })
}
function send(res, { status, body }) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}
function originOf(req) {
  return req.headers.origin || (req.headers.host ? `http://${req.headers.host}` : 'http://localhost:5178')
}

export function stripeDev(env = {}) {
  return {
    name: 'spoorwijs-stripe-dev',
    configureServer(server) {
      server.middlewares.use('/api/stripe/config', (_req, res) => send(res, stripeConfig(env)))

      server.middlewares.use('/api/stripe/checkout', async (req, res) => {
        if (req.method !== 'POST') return send(res, { status: 405, body: { error: 'method_not_allowed' } })
        let b
        try { b = await readJson(req) } catch { return send(res, { status: 400, body: { error: 'bad_json' } }) }
        send(res, await stripeCheckout(env, b, originOf(req)))
      })

      server.middlewares.use('/api/stripe/status', async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        send(res, await stripeStatus(env, url.searchParams.get('id')))
      })
    },
  }
}
