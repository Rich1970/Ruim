// Payment module (sandbox / test mode).
//
// This simulates the checkout so the full experience is testable without a
// Stripe account or a booking-aggregator contract. The `simulatePayment`
// function is the seam: in production it is replaced by a backend call that
// creates a real payment (Stripe) and a real booking (aggregator). The rest of
// the app — breakdown, ticket, "My trips" — stays identical.

export const SERVICE_FEE_PCT = 0.01

export interface PriceBreakdown {
  fare: number
  fee: number
  total: number
}

export function priceBreakdown(fareTotal: number): PriceBreakdown {
  const fee = Math.round(fareTotal * SERVICE_FEE_PCT * 100) / 100
  const total = Math.round((fareTotal + fee) * 100) / 100
  return { fare: fareTotal, fee, total }
}

export function euro(n: number): string {
  return '€' + n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export type PayError = 'pay_declined' | 'pay_card_invalid'
export interface PaymentResult {
  ok: boolean
  error?: PayError
  /** Simulated PSP reference (would come from Stripe in production). */
  pspRef?: string
}

export async function simulatePayment(cardNumber: string): Promise<PaymentResult> {
  const digits = cardNumber.replace(/\D/g, '')
  await new Promise((r) => setTimeout(r, 1500))
  if (digits === '4000000000000002') return { ok: false, error: 'pay_declined' }
  if (digits.length !== 16) return { ok: false, error: 'pay_card_invalid' }
  // 4242… (and any other 16-digit test card) succeeds in the sandbox.
  return { ok: true, pspRef: 'pi_test_' + digits.slice(-4) + '_' + refSuffix() }
}

function refSuffix(): string {
  let s = ''
  let seed = Date.now()
  for (let i = 0; i < 6; i++) { seed = (seed * 48271) % 0x7fffffff; s += (seed % 36).toString(36) }
  return s
}

export function formatCardNumber(v: string): string {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
export function formatExpiry(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d
}

// --- real Stripe test checkout (backed by the dev-server middleware) --------
const PENDING_KEY = 'spoorwijs_pending_v1'

export function stashPending(payload: unknown): void {
  localStorage.setItem(PENDING_KEY, JSON.stringify(payload))
}
export function readPending<T = any>(): T | null {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || 'null') } catch { return null }
}
export function clearPending(): void {
  localStorage.removeItem(PENDING_KEY)
}

/** Is a Stripe (test) key configured on the backend? */
export async function stripeEnabled(): Promise<boolean> {
  try {
    const r = await fetch('/api/stripe/config')
    if (!r.ok) return false
    const j = await r.json()
    return !!j.stripe
  } catch { return false }
}

/** Create a Checkout Session, stash the pending booking, and redirect to Stripe. */
export async function beginStripeCheckout(opts: { amount: number; name: string; kind: string; pending: unknown }): Promise<void> {
  stashPending(opts.pending)
  let data: any
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amount: opts.amount, name: opts.name, kind: opts.kind }),
    })
    data = await res.json()
  } catch (e) { clearPending(); throw new Error('network') }
  if (data?.url) { window.location.href = data.url; return }
  clearPending()
  throw new Error(data?.error || 'stripe_error')
}

export async function checkoutPaid(sessionId: string): Promise<boolean> {
  try {
    const r = await fetch('/api/stripe/status?id=' + encodeURIComponent(sessionId))
    if (!r.ok) return false
    const j = await r.json()
    return !!j.paid
  } catch { return false }
}
