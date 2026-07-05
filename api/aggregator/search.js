import { aggregatorSearch } from '../../server/handlers.mjs'
import { sendJson, readBody } from '../../server/serverless.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, { status: 405, body: { error: 'method_not_allowed' } })
  const body = await readBody(req)
  sendJson(res, await aggregatorSearch(process.env, body))
}
