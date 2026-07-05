import { emailConfig, emailSend } from './handlers.mjs'

// Dev-server adapter over the shared email handlers (/api/email/*). In production
// the same handlers run as serverless functions (api/email/*.js). With no
// RESEND_API_KEY the send is simulated so the app keeps working end-to-end.

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

export function emailDev(env = {}) {
  return {
    name: 'spoorwijs-email-dev',
    configureServer(server) {
      server.middlewares.use('/api/email/config', (_req, res) => send(res, emailConfig(env)))

      server.middlewares.use('/api/email/send', async (req, res) => {
        if (req.method !== 'POST') return send(res, { status: 405, body: { error: 'method_not_allowed' } })
        let b
        try { b = await readJson(req) } catch { return send(res, { status: 400, body: { error: 'bad_json' } }) }
        send(res, await emailSend(env, b))
      })
    },
  }
}
