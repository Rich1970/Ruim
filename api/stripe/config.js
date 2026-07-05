import { stripeConfig } from '../../server/handlers.mjs'
import { sendJson } from '../../server/serverless.mjs'

export default function handler(_req, res) {
  sendJson(res, stripeConfig(process.env))
}
