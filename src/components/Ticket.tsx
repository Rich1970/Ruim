import React, { useMemo } from 'react'
import type { SavedTrip } from '../state/store'
import type { OperatorInfo } from '../engine/types'
import { useApp } from '../state/store'
import { fmtTime } from '../engine/planner'
import { fmtDateNL } from '../engine/searchParams'
import { euro } from '../engine/payment'
import { IconAlert, IconTicket } from './icons'

// --- decorative Aztec-style code (deterministic from the booking ref) -------
function buildMatrix(ref: string, n = 15): boolean[][] {
  const m: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false))
  let h = 2166136261 >>> 0
  for (let i = 0; i < ref.length; i++) { h ^= ref.charCodeAt(i); h = Math.imul(h, 16777619) }
  const rand = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000 }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) m[y][x] = rand() > 0.48
  const c = (n - 1) / 2
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const d = Math.max(Math.abs(x - c), Math.abs(y - c))
    if (d <= 3) m[y][x] = d % 2 === 0
  }
  return m
}

function AztecCode({ code, size = 108 }: { code: string; size?: number }) {
  const n = 15
  const m = useMemo(() => buildMatrix(code, n), [code])
  const cell = size / n
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Ticket-barcode" shapeRendering="crispEdges">
      <rect x="0" y="0" width={size} height={size} fill="#fff" />
      {m.map((row, y) => row.map((on, x) => on ? <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#0f1a17" /> : null))}
    </svg>
  )
}

function dedupeOps(trip: SavedTrip): OperatorInfo[] {
  const seen = new Set<string>(); const out: OperatorInfo[] = []
  for (const l of trip.journey.legs) if (!seen.has(l.operator.id)) { seen.add(l.operator.id); out.push(l.operator) }
  return out
}

export function Ticket({ trip }: { trip: SavedTrip }) {
  const { t, lang } = useApp()
  const j = trip.journey
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-200 bg-white">
      <div className="flex items-center gap-2 bg-brand-700 px-4 py-2.5 text-white">
        <IconTicket width={18} height={18} />
        <span className="font-bold">{t('ticket_title')}</span>
        <span className="chip ml-auto bg-amber-300 text-amber-900">{t('testmode')}</span>
      </div>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="text-lg font-extrabold text-ink">{trip.fromName} → {trip.toName}</div>
          <div className="text-sm text-ink-faint">{fmtDateNL(trip.date, lang)} · {fmtTime(j.depMin)}–{fmtTime(j.arrMin)}{j.arrDayOffset > 0 ? ` (+${j.arrDayOffset})` : ''}</div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <Row label={t('passenger_name')} value={trip.passengerName || '—'} />
            <Row label={t('passengers')} value={String(trip.passengers)} />
            <Row label={t('ticket_ref')} value={trip.ref} mono />
            {trip.grandTotal != null && <Row label={t('grand_total')} value={euro(trip.grandTotal)} />}
          </dl>
          <div className="mt-2 flex flex-wrap gap-1">
            {dedupeOps(trip).map((op) => (
              <span key={op.id} className="chip" style={{ backgroundColor: op.color, color: op.textColor ?? '#fff' }}>{op.short}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 self-center">
          <AztecCode code={trip.ref} />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{trip.ref}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-t border-dashed border-brand-200 bg-amber-50 px-4 py-2 text-[11px] font-semibold text-amber-800">
        <IconAlert width={13} height={13} /> {t('ticket_demo_note')}
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className={`font-semibold text-ink ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</dd>
    </div>
  )
}

export function SupportNotice({ trip }: { trip: SavedTrip }) {
  const { t } = useApp()
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
      <div className="flex items-center gap-1.5 text-sm font-bold text-rose-800">
        <IconAlert width={15} height={15} /> {t('support_title')}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-rose-700">{t('support_body')}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {dedupeOps(trip).map((op) => (
          <a key={op.id} href={op.site} target="_blank" rel="noopener"
            className="chip border border-rose-200 bg-white text-rose-700 hover:bg-rose-100">
            {op.name} ↗
          </a>
        ))}
      </div>
    </div>
  )
}
