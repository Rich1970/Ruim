import { stripeStatus } from '../../server/handlers.mjs'
import { sendJson } from '../../server/serverless.mjs'

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost')
  sendJson(res, await stripeStatus(process.env, url.searchParams.get('id')))
}
