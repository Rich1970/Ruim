import { aggregatorConfig, aggregatorSearch } from './handlers.mjs'

// Dev-server adapter over the shared aggregator handlers (/api/aggregator/*). In
// production the same handlers run as serverless functions (api/aggregator/*.js).
//
// This is the SEAM for a fase-2 booking partner (Distribusion / Trainline): real
// prices + bookable tickets. It stays disabled (→ app falls back to live/local)
// until a partner key is set AND the response mapping is completed — see the TODO
// in server/handlers.mjs (aggregatorSearch).

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

export function aggregatorDev(env = {}) {
  return {
    name: 'spoorwijs-aggregator-dev',
    configureServer(server) {
      server.middlewares.use('/api/aggregator/config', (_req, res) => send(res, aggregatorConfig(env)))

      server.middlewares.use('/api/aggregator/search', async (req, res) => {
        if (req.method !== 'POST') return send(res, { status: 405, body: { error: 'method_not_allowed' } })
        let b
        try { b = await readJson(req) } catch { return send(res, { status: 400, body: { error: 'bad_json' } }) }
        send(res, await aggregatorSearch(env, b))
      })
    },
  }
}
