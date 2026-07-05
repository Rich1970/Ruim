// Transactional email — client seam over the /api/email/* dev-server backend.
//
// The app never holds the provider key: it POSTs a rendered HTML mail to the
// backend, which either sends it (Resend key present) or reports it simulated.
// Both the booking confirmation and the sale-window-opened alert flow through
// here, so wiring a real key lights up real delivery everywhere at once.

import type { SavedTrip } from '../state/store'
import type { Lang } from '../i18n/strings'
import { translate as tr } from '../i18n/strings'
import { fmtTime, fmtDuration } from './planner'
import { fmtDateNL } from './searchParams'
import { euro } from './payment'

export type EmailKind = 'confirmation' | 'sale_open'

export interface EmailResult {
  ok: boolean
  simulated?: boolean
  to?: string
  error?: string
}

/** Is a real (Resend) email key configured on the backend? */
export async function emailEnabled(): Promise<boolean> {
  try {
    const r = await fetch('/api/email/config')
    if (!r.ok) return false
    const j = await r.json()
    return !!j.email
  } catch { return false }
}

async function postEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  try {
    const r = await fetch('/api/email/send', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) return { ok: false, error: j?.error || 'email_error' }
    return { ok: true, simulated: !!j.simulated, to: j.to }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'network' }
  }
}

/** Render + send the right mail for a trip. Fire-and-forget safe (never throws). */
export async function sendTripEmail(kind: EmailKind, trip: SavedTrip, lang: Lang): Promise<EmailResult> {
  const to = (trip.email || '').trim()
  if (!/.+@.+\..+/.test(to)) return { ok: false, error: 'invalid_recipient' }
  const { subject, html } = kind === 'confirmation'
    ? renderConfirmationEmail(trip, lang)
    : renderSaleOpenEmail(trip, lang)
  return postEmail(to, subject, html)
}

// --- HTML rendering (inline styles — email clients ignore <style>/classes) --

const BRAND = '#005caa'
const INK = '#1b2431'
const SOFT = '#4a5568'
const FAINT = '#8a93a2'

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
}

function shell(inner: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6f9;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:${INK}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:24px 0">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:92%;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e7ebf1">
<tr><td style="background:${BRAND};padding:18px 24px;color:#fff;font-size:20px;font-weight:800">🚆 Spoorwijs</td></tr>
<tr><td style="padding:22px 24px">${inner}</td></tr>
</table>
</td></tr></table></body></html>`
}

function legsTable(trip: SavedTrip): string {
  const rows = trip.journey.legs.map((leg) => `
    <tr>
      <td style="padding:4px 0;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap;color:${INK}">${fmtTime(leg.depMin)}–${fmtTime(leg.arrMin)}</td>
      <td style="padding:4px 8px;color:${BRAND};font-weight:700;white-space:nowrap">${esc(leg.operator.short || leg.operator.name)}</td>
      <td style="padding:4px 0;color:${SOFT}">${esc(leg.from.city)} → ${esc(leg.to.city)}</td>
    </tr>`).join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse">${rows}</table>`
}

function summaryCard(trip: SavedTrip, lang: Lang): string {
  const j = trip.journey
  const off = j.arrDayOffset > 0 ? ` (+${j.arrDayOffset})` : ''
  const total = trip.grandTotal != null ? `<div style="margin-top:6px;font-size:13px;color:${SOFT}">${esc(tr(lang, 'email_total'))}: <strong style="color:${INK}">${esc(euro(trip.grandTotal))}</strong></div>` : ''
  return `<div style="border:1px solid #dbe6f2;background:#f2f7fc;border-radius:12px;padding:14px 16px;margin:14px 0">
    <div style="font-size:18px;font-weight:800;color:${INK}">${esc(trip.fromName)} → ${esc(trip.toName)}</div>
    <div style="color:${FAINT};font-size:13px;margin-top:2px">${esc(fmtDateNL(trip.date, lang))} · ${fmtTime(j.depMin)}–${fmtTime(j.arrMin)}${off} · ${esc(fmtDuration(j.durationMin))}</div>
    <div style="margin-top:6px;font-size:12px;color:${SOFT}">${esc(tr(lang, 'ref'))}: <strong style="font-family:monospace;color:${INK}">${esc(trip.ref)}</strong></div>
    ${total}
  </div>`
}

function greeting(trip: SavedTrip, lang: Lang): string {
  const name = (trip.passengerName || '').split(' ')[0].trim()
  return name ? tr(lang, 'email_greeting', { name }) : tr(lang, 'email_greeting_generic')
}

function footer(lang: Lang): string {
  return `<p style="border-top:1px solid #eef1f5;margin-top:18px;padding-top:14px;font-size:11px;line-height:1.6;color:${FAINT}">${esc(tr(lang, 'email_footer'))}</p>
  <p style="text-align:center;font-size:11px;font-weight:700;color:#b7791f;margin-top:10px">${esc(tr(lang, 'email_testnote'))}</p>`
}

export function renderConfirmationEmail(trip: SavedTrip, lang: Lang): { subject: string; html: string } {
  const subject = tr(lang, 'email_subject', { from: trip.fromName, to: trip.toName })
  const inner = `
    <p style="font-weight:700;color:${INK};margin:0 0 8px">${esc(greeting(trip, lang))}</p>
    <p style="color:${SOFT};margin:0 0 4px">${esc(tr(lang, 'email_intro'))}</p>
    ${summaryCard(trip, lang)}
    ${legsTable(trip)}
    <p style="background:#eef5fb;color:${BRAND};border-radius:8px;padding:10px 12px;font-size:13px;margin:14px 0">${esc(tr(lang, 'email_ticket_note'))}</p>
    <p style="color:#a02c3a;font-size:12px;line-height:1.6">${esc(tr(lang, 'support_body'))}</p>
    ${footer(lang)}`
  return { subject, html: shell(inner) }
}

export function renderSaleOpenEmail(trip: SavedTrip, lang: Lang): { subject: string; html: string } {
  const subject = tr(lang, 'sale_open_email_subject', { from: trip.fromName, to: trip.toName })
  const inner = `
    <p style="font-weight:700;color:${INK};margin:0 0 8px">${esc(greeting(trip, lang))}</p>
    <p style="color:${SOFT};margin:0 0 4px">${esc(tr(lang, 'sale_open_email_intro'))}</p>
    ${summaryCard(trip, lang)}
    ${legsTable(trip)}
    <p style="background:#ecfbf1;color:#1b7a46;border-radius:8px;padding:10px 12px;font-size:13px;margin:14px 0;font-weight:600">${esc(tr(lang, 'sale_open_email_cta'))}</p>
    ${footer(lang)}`
  return { subject, html: shell(inner) }
}
