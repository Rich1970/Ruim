import React from 'react'
import type { Journey } from '../engine/types'
import { journeyTicketing } from '../engine/ticketing'
import { useApp } from '../state/store'
import { IconCheck, IconTicket, IconAlert } from './icons'

export function TicketingInfo({ journey }: { journey: Journey }) {
  const { t } = useApp()
  const ti = journeyTicketing(journey)

  return (
    <div className={`card p-4 ${ti.through ? 'border-emerald-200' : 'border-amber-200'}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${ti.through ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
          {ti.through ? <IconCheck /> : <IconTicket />}
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-bold text-ink">
            {ti.through ? t('tk_through') : t('tk_separate', { n: ti.ticketCount })}
          </div>
          <div className="mt-0.5 text-ink-soft">
            {ti.through ? t('tk_through_note') : t('tk_separate_note', { n: ti.ticketCount })}
          </div>
          {!ti.through && ti.international && (
            <div className="mt-1.5 inline-flex items-start gap-1.5 text-xs text-amber-800">
              <IconAlert width={13} height={13} className="mt-0.5 shrink-0" /> {t('tk_ajc')}
            </div>
          )}
          {ti.reservations > 0 && (
            <div className="mt-1.5 text-xs text-ink-faint">{t('tk_reservations', { n: ti.reservations })}</div>
          )}
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
            <IconCheck width={13} height={13} /> {t('tk_one_booking')}
          </div>
        </div>
      </div>
    </div>
  )
}
