import React, { useEffect, useState } from 'react'
import { useApp } from '../state/store'
import type { DiscountCard } from '../engine/cards'
import { demoPriceOf } from '../engine/cards'
import { priceBreakdown, simulatePayment, euro, formatCardNumber, formatExpiry, stripeEnabled, beginStripeCheckout, type PayError } from '../engine/payment'
import { IconX, IconLock, IconCheck, IconAlert, IconArrowRight } from './icons'
import { Spinner } from './bits'

export function CardCheckoutModal({ card, onClose }: { card: DiscountCard; onClose: () => void }) {
  const { t, user, setDefaultCard } = useApp()
  const bd = priceBreakdown(demoPriceOf(card.id))

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [num, setNum] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [status, setStatus] = useState<'idle' | 'paying' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [stripeOn, setStripeOn] = useState<boolean | null>(null)

  useEffect(() => { stripeEnabled().then(setStripeOn) }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  const digits = num.replace(/\D/g, '')
  const baseFilled = !!(name.trim() && /.+@.+\..+/.test(email))
  const simFilled = baseFilled && digits.length === 16 && expiry.length === 5 && cvc.length >= 3
  const canPay = stripeOn ? baseFilled : simFilled

  async function pay() {
    setError(null)
    if (stripeOn) {
      if (!baseFilled) { setError('fill_details'); return }
      setStatus('paying')
      try {
        await beginStripeCheckout({ amount: bd.total, name: `Spoorwijs · ${card.name}`, kind: 'card', pending: { kind: 'card', cardId: card.id } })
      } catch { setStatus('idle'); setError('pay_card_invalid') }
      return
    }
    if (!simFilled) { setError('fill_details'); return }
    setStatus('paying')
    const res = await simulatePayment(num)
    if (!res.ok) { setStatus('idle'); setError((res.error as PayError) ?? 'pay_card_invalid'); return }
    if (user) setDefaultCard(card.id)
    setStatus('done')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-lift sm:rounded-3xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('cardco_title')}>
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-black/5 bg-white/95 px-4 py-3 backdrop-blur">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white"><IconLock width={16} height={16} /></span>
          <span className="font-extrabold text-ink">{t('cardco_title')}</span>
          <span className="chip bg-amber-100 text-amber-800">{t('testmode')}</span>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-ink-faint hover:bg-brand-50" aria-label={t('close')}><IconX width={18} height={18} /></button>
        </div>

        {status === 'done' ? (
          <div className="p-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><IconCheck /></span>
            <h3 className="mt-4 text-lg font-extrabold text-ink">{t('cardco_success')}</h3>
            <p className="mt-1 text-sm text-ink-soft">{t('cardco_success_note', { issuer: card.issuer })}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-2.5">
              <span className="text-xl">{card.flag}</span><span className="font-bold text-ink">{card.name}</span>
            </div>
            <button onClick={onClose} className="btn-primary mt-5 w-full !py-3">{t('close')}</button>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/40 p-3">
              <span className="text-2xl">{card.flag}</span>
              <div><div className="font-bold text-ink">{card.name}</div><div className="text-xs text-ink-faint">{card.issuer}</div></div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">{t('cardco_issuer_note', { issuer: card.issuer })}</div>

            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 text-sm">
              <div className="flex items-center justify-between py-0.5"><span className="text-ink-soft">{t('cardco_pass_price')}</span><span className="font-semibold tabular-nums text-ink">{euro(bd.fare)}</span></div>
              <div className="flex items-center justify-between py-0.5"><span className="font-semibold text-brand-700">{t('service_fee')}</span><span className="font-semibold tabular-nums text-brand-700">{euro(bd.fee)}</span></div>
              <div className="my-2 border-t border-brand-100" />
              <div className="flex items-center justify-between"><span className="font-extrabold text-ink">{t('grand_total')}</span><span className="text-xl font-extrabold text-brand-700">{euro(bd.total)}</span></div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('passenger_name')}><input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></Field>
              <Field label={t('email')}><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
            </div>

            {stripeOn ? (
              <div className="flex items-start gap-1.5 rounded-xl border border-brand-100 bg-brand-50/40 p-3 text-[11px] leading-relaxed text-ink-soft">
                <IconLock width={14} height={14} className="mt-0.5 shrink-0 text-brand-600" /> {t('stripe_redirect_note')}
              </div>
            ) : (
              <div className="grid gap-3">
                <Field label={t('card_number')}><input className="field font-mono" inputMode="numeric" value={num} onChange={(e) => setNum(formatCardNumber(e.target.value))} placeholder="4242 4242 4242 4242" autoComplete="cc-number" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('expiry')}><input className="field font-mono" inputMode="numeric" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="12/28" autoComplete="cc-exp" /></Field>
                  <Field label={t('cvc')}><input className="field font-mono" inputMode="numeric" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" autoComplete="cc-csc" /></Field>
                </div>
                <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-faint"><IconLock width={13} height={13} className="mt-0.5 shrink-0" /> {t('test_card_hint')}</p>
              </div>
            )}

            {error && <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"><IconAlert width={15} height={15} /> {t(error as any)}</div>}

            <button onClick={pay} disabled={status === 'paying' || !canPay} className="btn-primary w-full !py-3 text-base">
              {status === 'paying' ? <><Spinner className="text-white" /> {t('paying')}</> : <>{stripeOn ? t('stripe_pay') : t('pay_now', { amount: euro(bd.total) })} <IconArrowRight width={18} height={18} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label mb-1 block">{label}</label>{children}</div>
}
