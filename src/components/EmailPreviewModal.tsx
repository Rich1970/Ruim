import React, { useEffect } from 'react'
import type { SavedTrip } from '../state/store'
import { useApp } from '../state/store'
import { fmtTime, fmtDuration } from '../engine/planner'
import { fmtDateNL } from '../engine/searchParams'
import { euro } from '../engine/payment'
import { OperatorBadge } from './bits'
import { IconX, IconTrain } from './icons'

export function EmailPreviewModal({ trip, onClose }: { trip: SavedTrip; onClose: () => void }) {
  const { t, lang } = useApp()
  const j = trip.journey

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  const subject = t('email_subject', { from: trip.fromName, to: trip.toName })

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-lift sm:rounded-3xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('email_view')}>
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-black/5 bg-white/95 px-4 py-3 backdrop-blur">
          <span className="font-extrabold text-ink">{t('email_view')}</span>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-ink-faint hover:bg-brand-50" aria-label={t('close')}><IconX width={18} height={18} /></button>
        </div>

        {/* envelope headers */}
        <div className="space-y-1 border-b border-black/5 bg-brand-50/40 px-4 py-3 text-xs">
          <div><span className="font-semibold text-ink-faint">Van:</span> <span className="text-ink">Spoorwijs &lt;noreply@spoorwijs.app&gt;</span></div>
          <div><span className="font-semibold text-ink-faint">Aan:</span> <span className="text-ink">{trip.email || '—'}</span></div>
          <div><span className="font-semibold text-ink-faint">Onderwerp:</span> <span className="font-semibold text-ink">{subject}</span></div>
        </div>

        {/* email body */}
        <div className="p-4">
          <div className="overflow-hidden rounded-2xl border border-black/5">
            <div className="flex items-center gap-2 bg-brand-600 px-5 py-4 text-white">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15"><IconTrain width={18} height={18} /></span>
              <span className="text-lg font-extrabold">Spoorwijs</span>
            </div>
            <div className="space-y-4 px-5 py-5 text-sm text-ink-soft">
              <p className="font-semibold text-ink">{t('email_greeting', { name: (trip.passengerName || '').split(' ')[0] || '' })}</p>
              <p>{t('email_intro')}</p>

              <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                <div className="text-lg font-extrabold text-ink">{trip.fromName} → {trip.toName}</div>
                <div className="text-ink-faint">{fmtDateNL(trip.date, lang)} · {fmtTime(j.depMin)}–{fmtTime(j.arrMin)}{j.arrDayOffset > 0 ? ` (+${j.arrDayOffset})` : ''} · {fmtDuration(j.durationMin)}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {dedupeOps(trip).map((op) => <OperatorBadge key={op.id} op={op} small />)}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-brand-100 pt-3 text-xs">
                  <div><div className="uppercase tracking-wide text-ink-faint">{t('ref')}</div><div className="font-mono font-semibold text-ink">{trip.ref}</div></div>
                  {trip.grandTotal != null && <div><div className="uppercase tracking-wide text-ink-faint">{t('email_total')}</div><div className="font-semibold text-ink">{euro(trip.grandTotal)}</div></div>}
                </div>
              </div>

              <div className="space-y-1.5">
                {j.legs.map((leg, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-24 shrink-0 font-bold tabular-nums text-ink">{fmtTime(leg.depMin)}–{fmtTime(leg.arrMin)}</span>
                    <OperatorBadge op={leg.operator} small />
                    <span className="truncate text-ink-soft">{leg.from.city} → {leg.to.city}</span>
                  </div>
                ))}
              </div>

              <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">{t('email_ticket_note')}</p>
              <p className="text-xs leading-relaxed text-rose-700">{t('support_body')}</p>
              <p className="border-t border-black/5 pt-3 text-[11px] leading-relaxed text-ink-faint">{t('email_footer')}</p>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] font-semibold text-amber-700">{t('email_testnote')}</p>
        </div>
      </div>
    </div>
  )
}

function dedupeOps(trip: SavedTrip) {
  const seen = new Set<string>(); const out = []
  for (const l of trip.journey.legs) if (!seen.has(l.operator.id)) { seen.add(l.operator.id); out.push(l.operator) }
  return out
}
