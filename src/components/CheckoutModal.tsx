import React, { useEffect, useMemo, useState } from 'react'
import type { Journey, FareClass, SearchQuery, OperatorInfo } from '../engine/types'
import { useApp, genRef, type SavedTrip } from '../state/store'
import { shortName } from '../engine/searchParams'
import { priceBreakdown, simulatePayment, euro, formatCardNumber, formatExpiry, stripeEnabled, beginStripeCheckout, type PayError } from '../engine/payment'
import { sendTripEmail } from '../engine/email'
import { IconX, IconLock, IconCheck, IconAlert, IconArrowRight } from './icons'
import { Spinner } from './bits'

export function CheckoutModal({
  journey, query, fareClass, onClose, onBooked,
}: {
  journey: Journey
  query: SearchQuery
  fareClass: FareClass
  onClose: () => void
  onBooked: (trip: SavedTrip) => void
}) {
  const { t, lang, user } = useApp()
  const fareTotal = journey.fares[fareClass].price * query.passengers
  const bd = useMemo(() => priceBreakdown(fareTotal), [fareTotal])
  const operators = useMemo(() => dedupeOps(journey), [journey])

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [ack, setAck] = useState(false)
  const [status, setStatus] = useState<'idle' | 'paying'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [stripeOn, setStripeOn] = useState<boolean | null>(null)

  useEffect(() => { stripeEnabled().then(setStripeOn) }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  const cardDigits = card.replace(/\D/g, '')
  const baseFilled = name.trim() && /.+@.+\..+/.test(email)
  const simFilled = baseFilled && cardDigits.length === 16 && expiry.length === 5 && cvc.length >= 3
  const canPay = ack && (stripeOn ? baseFilled : simFilled)

  function buildTrip(): SavedTrip {
    return {
      ref: genRef(), createdAt: Date.now(), status: 'booked', paid: true,
      fromId: query.from.id, toId: query.to.id,
      fromName: shortName(query.from.name), toName: shortName(query.to.name),
      date: query.date, passengers: query.passengers, card: query.card,
      fareClass, priceTotal: fareTotal, passengerName: name.trim(), email: email.trim(),
      serviceFee: bd.fee, grandTotal: bd.total, journey,
      notifications: [{ id: 'n' + Date.now(), at: Date.now(), kind: 'success', title: t('paid_booked'), body: t('support_body') }],
    }
  }

  async function pay() {
    setError(null)
    if (!ack) { setError('ack_required'); return }
    if (stripeOn) {
      if (!baseFilled) { setError('fill_details'); return }
      setStatus('paying')
      try {
        await beginStripeCheckout({
          amount: bd.total,
          name: `Spoorwijs · ${shortName(query.from.name)} → ${shortName(query.to.name)}`,
          kind: 'journey',
          pending: { kind: 'journey', trip: buildTrip() },
        })
      } catch { setStatus('idle'); setError('pay_card_invalid') }
      return
    }
    if (!simFilled) { setError('fill_details'); return }
    setStatus('paying')
    const res = await simulatePayment(card)
    setStatus('idle')
    if (!res.ok) { setError((res.error as PayError) ?? 'pay_card_invalid'); return }
    const trip = buildTrip()
    // Fire-and-forget the confirmation email (real via Resend if a key is set,
    // otherwise simulated by the backend — either way the booking proceeds).
    void sendTripEmail('confirmation', trip, lang)
    onBooked(trip)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-lift sm:rounded-3xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('checkout_title')}>
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-black/5 bg-white/95 px-4 py-3 backdrop-blur">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white"><IconLock width={16} height={16} /></span>
          <span className="font-extrabold text-ink">{t('checkout_title')}</span>
          <span className="chip bg-amber-100 text-amber-800">{t('testmode')}</span>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-ink-faint hover:bg-brand-50" aria-label={t('close')}><IconX width={18} height={18} /></button>
        </div>

        <div className="space-y-4 p-4">
          <div className="text-sm text-ink-soft">
            <span className="font-bold text-ink">{shortName(query.from.name)} → {shortName(query.to.name)}</span>
            {' '}· {t(`fare_${fareClass}` as any)} · {query.passengers}×
          </div>

          {/* Disclosure — you book with the carrier */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <div className="flex items-center gap-1.5 text-sm font-bold text-amber-900">
              <IconAlert width={16} height={16} /> {t('checkout_via_carrier_title')}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-amber-800">{t('checkout_via_carrier_body')}</p>
            <div className="mt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">{t('checkout_carriers')}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {operators.map((op) => (
                  <a key={op.id} href={op.site} target="_blank" rel="noopener" className="chip border border-amber-200 bg-white text-amber-900 hover:bg-amber-100">{op.name} ↗</a>
                ))}
              </div>
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg bg-white/70 p-2.5 text-xs text-ink-soft">
              <input type="checkbox" checked={ack} onChange={(e) => { setAck(e.target.checked); setError(null) }} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600" />
              <span>{t('checkout_ack')}</span>
            </label>
          </div>

          {/* Price breakdown */}
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 text-sm">
            <Line label={t('fare_ticket')} value={euro(bd.fare)} />
            <Line label={t('service_fee')} value={euro(bd.fee)} accent />
            <div className="my-2 border-t border-brand-100" />
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-ink">{t('grand_total')}</span>
              <span className="text-xl font-extrabold text-brand-700">{euro(bd.total)}</span>
            </div>
            <div className="mt-1 text-[11px] text-ink-faint">{t('free_note')}</div>
          </div>

          {/* Passenger */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('passenger_name')}><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Richard van Barneveld" autoComplete="name" /></Field>
            <Field label={t('email')}><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jij@voorbeeld.nl" autoComplete="email" /></Field>
          </div>

          {/* Payment: real Stripe if configured, else sandbox card form */}
          {stripeOn ? (
            <div className="flex items-start gap-1.5 rounded-xl border border-brand-100 bg-brand-50/40 p-3 text-[11px] leading-relaxed text-ink-soft">
              <IconLock width={14} height={14} className="mt-0.5 shrink-0 text-brand-600" /> {t('stripe_redirect_note')}
            </div>
          ) : (
            <div className="grid gap-3">
              <Field label={t('card_number')}><input className="field font-mono" inputMode="numeric" value={card} onChange={(e) => setCard(formatCardNumber(e.target.value))} placeholder="4242 4242 4242 4242" autoComplete="cc-number" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('expiry')}><input className="field font-mono" inputMode="numeric" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="12/28" autoComplete="cc-exp" /></Field>
                <Field label={t('cvc')}><input className="field font-mono" inputMode="numeric" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" autoComplete="cc-csc" /></Field>
              </div>
              <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-faint"><IconLock width={13} height={13} className="mt-0.5 shrink-0" /> {t('test_card_hint')}</p>
            </div>
          )}

          {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{t(error as any)}</div>}

          <button onClick={pay} disabled={status === 'paying' || !canPay} className="btn-primary w-full !py-3 text-base">
            {status === 'paying'
              ? <><Spinner className="text-white" /> {t('paying')}</>
              : <>{stripeOn ? t('stripe_pay') : t('pay_now', { amount: euro(bd.total) })} <IconArrowRight width={18} height={18} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={accent ? 'font-semibold text-brand-700' : 'text-ink-soft'}>{label}</span>
      <span className={`font-semibold tabular-nums ${accent ? 'text-brand-700' : 'text-ink'}`}>{value}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label mb-1 block">{label}</label>{children}</div>
}

function dedupeOps(j: Journey): OperatorInfo[] {
  const seen = new Set<string>(); const out: OperatorInfo[] = []
  for (const l of j.legs) if (!seen.has(l.operator.id)) { seen.add(l.operator.id); out.push(l.operator) }
  return out
}
