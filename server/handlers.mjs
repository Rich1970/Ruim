// Shared backend logic for the three API seams (stripe / email / aggregator).
//
// Framework-agnostic: every handler takes a plain `env` object (so it works with
// Vite's loadEnv in dev AND process.env in serverless) and returns
// `{ status, body }`. The thin adapters — `server/*-dev.mjs` (Vite middleware)
// and `api/**/*.js` (Vercel serverless functions) — just wire req/res to these.
// Secret keys never reach the browser in either environment.

import Stripe from 'stripe'

// --- Stripe ----------------------------------------------------------------
const stripeClients = new Map()
function getStripe(key) {
  if (!key || !key.startsWith('sk_')) return null
  if (!stripeClients.has(key)) stripeClients.set(key, new Stripe(key))
  return stripeClients.get(key)
}

export function stripeConfig(env) {
  const key = env.STRIPE_SECRET_KEY
  const testMode = !key || key.includes('_test_')
  return { status: 200, body: { stripe: !!getStripe(key), testMode } }
}

export async function stripeCheckout(env, b, origin) {
  const stripe = getStripe(env.STRIPE_SECRET_KEY)
  if (!stripe) return { status: 501, body: { error: 'stripe_not_configured' } }
  const amount = Math.round(Number(b?.amount) * 100)
  if (!Number.isFinite(amount) || amount < 50) return { status: 400, body: { error: 'invalid_amount' } }
  const base = origin || 'http://localhost:5178'
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: amount,
          product_data: { name: String(b.name || 'Spoorwijs').slice(0, 120) },
        },
      }],
      success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout/cancel`,
      metadata: { kind: String(b.kind || ''), token: String(b.token || '') },
    })
    return { status: 200, body: { url: session.url, id: session.id } }
  } catch (e) {
    return { status: 502, body: { error: e?.message || 'stripe_error' } }
  }
}

export async function stripeStatus(env, id) {
  const stripe = getStripe(env.STRIPE_SECRET_KEY)
  if (!stripe) return { status: 501, body: { error: 'stripe_not_configured' } }
  if (!id) return { status: 400, body: { error: 'missing_id' } }
  try {
    const s = await stripe.checkout.sessions.retrieve(id)
    return { status: 200, body: { paid: s.payment_status === 'paid', status: s.status } }
  } catch (e) {
    return { status: 502, body: { error: e?.message || 'stripe_error' } }
  }
}

// --- Email (Resend) --------------------------------------------------------
export function emailFrom(env) {
  return env.EMAIL_FROM || 'Spoorwijs <onboarding@resend.dev>'
}

export function emailConfig(env) {
  const key = env.RESEND_API_KEY
  const enabled = !!key && key.startsWith('re_')
  return { status: 200, body: { email: enabled, from: emailFrom(env) } }
}

export async function emailSend(env, b) {
  const key = env.RESEND_API_KEY
  const enabled = !!key && key.startsWith('re_')
  const to = String(b?.to || '').trim()
  const subject = String(b?.subject || '').slice(0, 200)
  const html = String(b?.html || '')
  if (!/.+@.+\..+/.test(to)) return { status: 400, body: { error: 'invalid_recipient' } }
  if (!enabled) return { status: 200, body: { simulated: true, to, subject } }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: emailFrom(env), to, subject, html }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) return { status: 502, body: { error: data?.message || 'email_provider_error' } }
    return { status: 200, body: { simulated: false, id: data?.id, to } }
  } catch (e) {
    return { status: 502, body: { error: e?.message || 'email_error' } }
  }
}

// --- Fase-2 booking aggregator (Distribusion / Trainline) ------------------
export function aggregatorConfig(env) {
  const key = env.DISTRIBUSION_API_KEY
  const enabled = !!key && key.length > 8
  return { status: 200, body: { enabled, provider: 'distribusion' } }
}

export async function aggregatorSearch(env, _b) {
  const key = env.DISTRIBUSION_API_KEY
  const enabled = !!key && key.length > 8
  if (!enabled) return { status: 501, body: { error: 'aggregator_not_configured' } }
  // Real integration goes here (see server/aggregator-dev.mjs for the mapping
  // TODO). Until the partner response mapping is completed, return an empty set
  // so the client falls back cleanly — never fake data.
  return { status: 200, body: { source: 'distribusion', journeys: [], note: 'adapter_stub' } }
}
