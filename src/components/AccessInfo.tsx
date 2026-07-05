import React from 'react'
import type { AccessLeg } from '../engine/types'
import { useApp } from '../state/store'

function modeKey(m: AccessLeg['mode']): 'by_walk' | 'by_car' | 'by_bike' {
  return m === 'CAR' ? 'by_car' : m === 'BIKE' ? 'by_bike' : 'by_walk'
}
function modeEmoji(m: AccessLeg['mode']): string {
  return m === 'CAR' ? '🚗' : m === 'BIKE' ? '🚲' : '🚶'
}

/** Compact chip for result cards. */
export function AccessChip({ a, kind }: { a: AccessLeg; kind: 'access' | 'egress' }) {
  const { t } = useApp()
  const target = kind === 'egress'
    ? t('to_dest_note', { place: a.placeName })
    : t('to_station_note', { station: a.stationName })
  return (
    <span className="chip bg-amber-50 text-amber-800">
      {modeEmoji(a.mode)} {a.km} km · ~{a.minutes} min {target}
    </span>
  )
}

/** Full row for the journey timeline. */
export function AccessRow({ a, kind }: { a: AccessLeg; kind: 'access' | 'egress' }) {
  const { t } = useApp()
  const place = kind === 'egress' ? a.placeName : a.placeName
  return (
    <div className="flex items-center gap-3 border-y border-dashed border-amber-200 bg-amber-50/60 px-4 py-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-lg">{modeEmoji(a.mode)}</span>
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-bold text-amber-900">
          {kind === 'egress' ? t('egress_title') : t('access_title')} · {a.km} km · ~{a.minutes} min {t(modeKey(a.mode))}
        </div>
        <div className="text-xs text-amber-800">
          {kind === 'egress'
            ? `${t('onward_from', { station: a.stationName })} → ${place}`
            : `${place} → ${a.stationName}`}
        </div>
      </div>
    </div>
  )
}
