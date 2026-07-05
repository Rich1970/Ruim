// Tiny adapter helpers shared by the Vercel serverless functions in /api.
// (Kept in /server, not /api, so it isn't exposed as its own endpoint.)

export function sendJson(res, { status, body }) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}

export function originOf(req) {
  return req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '')
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') { try { return JSON.parse(req.body || '{}') } catch { return {} } }
  return new Promise((resolve) => {
    let d = ''
    req.on('data', (c) => { d += c })
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')) } catch { resolve({}) } })
    req.on('error', () => resolve({}))
  })
}
