import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp, type SavedTrip } from '../state/store'
import { checkoutPaid, readPending, clearPending } from '../engine/payment'
import { sendTripEmail } from '../engine/email'
import { Spinner } from '../components/bits'
import { IconCheck, IconAlert } from '../components/icons'

type State = 'verifying' | 'card_ok' | 'failed'

export function CheckoutSuccess() {
  const { t, lang, addTrip, setDefaultCard } = useApp()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [state, setState] = useState<State>('verifying')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const sessionId = params.get('session_id')
    const pending = readPending<{ kind: string; trip?: SavedTrip; cardId?: string }>()
    async function run() {
      if (!sessionId || !pending) { setState('failed'); return }
      const paid = await checkoutPaid(sessionId)
      if (!paid) { setState('failed'); return }
      if (pending.kind === 'journey' && pending.trip) {
        addTrip(pending.trip)
        void sendTripEmail('confirmation', pending.trip, lang)
        clearPending()
        nav('/trips?new=' + pending.trip.ref, { replace: true })
      } else if (pending.kind === 'card' && pending.cardId) {
        setDefaultCard(pending.cardId)
        clearPending()
        setState('card_ok')
      } else { setState('failed') }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (state === 'verifying') {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center text-ink-soft">
        <Spinner className="text-brand-500" /> <p className="mt-3 font-semibold">{t('co_verifying')}</p>
      </div>
    )
  }
  if (state === 'card_ok') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><IconCheck /></span>
        <h1 className="mt-4 text-xl font-extrabold text-ink">{t('co_paid_card')}</h1>
        <p className="mt-2 text-ink-soft">{t('co_paid_card_note')}</p>
        <Link to="/kortingskaarten" className="btn-primary mt-5">{t('co_to_cards')}</Link>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600"><IconAlert /></span>
      <h1 className="mt-4 text-xl font-extrabold text-ink">{t('co_failed_title')}</h1>
      <p className="mt-2 text-ink-soft">{t('co_failed_body')}</p>
      <Link to="/" className="btn-primary mt-5">{t('co_back_search')}</Link>
    </div>
  )
}

export function CheckoutCancel() {
  const { t } = useApp()
  useEffect(() => { clearPending() }, [])
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600"><IconAlert /></span>
      <h1 className="mt-4 text-xl font-extrabold text-ink">{t('co_cancelled_title')}</h1>
      <p className="mt-2 text-ink-soft">{t('co_cancelled_body')}</p>
      <Link to="/" className="btn-primary mt-5">{t('co_back_search')}</Link>
    </div>
  )
}
