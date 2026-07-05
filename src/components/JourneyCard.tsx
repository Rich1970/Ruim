import React from 'react'
import type { Journey } from '../engine/types'
import { fmtTime, fmtDuration } from '../engine/planner'
import { riskiestTransfer } from '../engine/transfers'
import { useApp } from '../state/store'
import { OperatorBadge, Tag } from './bits'
import { AccessChip } from './AccessInfo'
import { IconClock, IconArrowRight, IconChevron, IconLeaf } from './icons'

export function JourneyCard({ j, passengers, onOpen }: { j: Journey; passengers: number; onOpen: () => void }) {
  const { t, lang } = useApp()
  const ops = dedupeOps(j)
  const changesLabel =
    j.changes === 0 ? t('direct') : `${j.changes} ${j.changes === 1 ? t('change_one') : t('changes')}`

  return (
    <button
      onClick={onOpen}
      className="card group w-full p-4 text-left transition hover:shadow-lift hover:-translate-y-0.5 sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {j.tags.map((tag) => <Tag key={tag} tag={tag} />)}
        {j.bookableFrom && (
          <span className="chip bg-amber-100 text-amber-800">{t('bookable_from')} {shortDate(j.bookableFrom, lang)}</span>
        )}
        {riskiestTransfer(j)?.level === 'tight' && (
          <span className="chip bg-rose-100 text-rose-700">⚠ {t('transfer_tight')}</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold tabular-nums text-ink">{fmtTime(j.depMin)}</span>
          <IconArrowRight width={18} height={18} className="text-ink-faint" />
          <span className="text-2xl font-extrabold tabular-nums text-ink">{fmtTime(j.arrMin)}</span>
          {j.arrDayOffset > 0 && <span className="chip bg-brand-50 text-brand-700">+{j.arrDayOffset} {t('next_day')}</span>}
        </div>

        <div className="ml-auto text-right">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{t('from_price')}</div>
          <div className="text-2xl font-extrabold text-brand-700">€{j.fares.saver.price * passengers}</div>
          {passengers > 1 && <div className="text-[11px] text-ink-faint">€{j.fares.saver.price} {t('per_person')}</div>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
          <IconClock width={16} height={16} className="text-ink-faint" /> {fmtDuration(j.durationMin)}
        </span>
        <span>{changesLabel}</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-700">
          <IconLeaf width={15} height={15} /> {j.co2Kg} kg CO₂
        </span>
        <div className="ml-auto hidden items-center gap-1.5 sm:flex">
          {ops.map((op) => <OperatorBadge key={op.id} op={op} small />)}
        </div>
        <IconChevron className="text-brand-500 transition group-hover:translate-x-0.5" width={18} height={18} />
      </div>
      <div className="mt-2 flex items-center gap-1.5 sm:hidden">
        {ops.map((op) => <OperatorBadge key={op.id} op={op} small />)}
      </div>
      {(j.access || j.egress) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-dashed border-brand-100 pt-2.5">
          {j.access && <AccessChip a={j.access} kind="access" />}
          {j.egress && <AccessChip a={j.egress} kind="egress" />}
        </div>
      )}
    </button>
  )
}

function dedupeOps(j: Journey) {
  const seen = new Set<string>()
  const out = []
  for (const l of j.legs) if (!seen.has(l.operator.id)) { seen.add(l.operator.id); out.push(l.operator) }
  return out
}

function shortDate(iso: string, lang: 'nl' | 'en') {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short' })
}
