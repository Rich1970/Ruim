import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { Place } from '../engine/types'
import { STATIONS, stationToPlace } from '../engine/data'
import { geocodePlaces } from '../engine/live'
import { COUNTRY_FLAG } from './StationSelect'
import { IconPin, IconTrain } from './icons'
import { Spinner } from './bits'

export function PlaceSearch({
  value, onChange, label, placeholder, exclude,
}: {
  value: Place | null
  onChange: (p: Place) => void
  label: string
  placeholder?: string
  exclude?: Place | null
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [live, setLive] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const reqRef = useRef(0)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Debounced live geocoding.
  useEffect(() => {
    if (!open) return
    const qy = query.trim()
    if (qy.length < 2) { setLive([]); setLoading(false); return }
    const id = ++reqRef.current
    setLoading(true)
    const h = setTimeout(async () => {
      const res = await geocodePlaces(qy)
      if (id === reqRef.current) { setLive(res); setLoading(false) }
    }, 260)
    return () => clearTimeout(h)
  }, [query, open])

  const localMatches = useMemo(() => {
    const qy = query.trim().toLowerCase()
    if (!qy) return STATIONS.slice(0, 8).map(stationToPlace)
    return STATIONS
      .filter((s) => s.city.toLowerCase().includes(qy) || s.name.toLowerCase().includes(qy))
      .slice(0, 6).map(stationToPlace)
  }, [query])

  const results = useMemo(() => {
    const base = query.trim().length >= 2 && live.length ? live : localMatches
    return base.filter((p) => !(exclude && sameSpot(p, exclude)))
  }, [live, localMatches, query, exclude])

  function pick(p: Place) { onChange(p); setQuery(''); setOpen(false); setLive([]) }

  return (
    <div ref={wrapRef} className="relative">
      <label className="label mb-1.5 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500">{value?.isStation === false ? <IconPin width={18} height={18} /> : <IconTrain width={18} height={18} />}</span>
        <input
          className="field pl-9"
          placeholder={placeholder}
          value={open ? query : value ? value.name : ''}
          onFocus={() => { setOpen(true); setQuery('') }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0) }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
            else if (e.key === 'Enter' && results[active]) { e.preventDefault(); pick(results[active]) }
            else if (e.key === 'Escape') setOpen(false)
          }}
          role="combobox" aria-expanded={open} aria-label={label} autoComplete="off"
        />
        {open && loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400"><Spinner /></span>}
      </div>
      {open && (
        <div className="absolute z-30 mt-1.5 max-h-80 w-full overflow-y-auto rounded-xl border border-brand-100 bg-white shadow-lift">
          {results.length === 0 && !loading && (
            <div className="px-3.5 py-3 text-sm text-ink-faint">{query.trim().length < 2 ? 'Typ een plaats of station…' : 'Niets gevonden'}</div>
          )}
          {results.map((p, i) => (
            <button
              key={p.id + i}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(p)}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm ${i === active ? 'bg-brand-50' : ''}`}
            >
              <span className="text-base leading-none">{p.country && COUNTRY_FLAG[p.country] ? COUNTRY_FLAG[p.country] : (p.isStation ? '🚉' : '📍')}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink">{p.name}</span>
                {p.region && <span className="block truncate text-xs text-ink-faint">{p.region}</span>}
              </span>
              <span className={`chip shrink-0 ${p.isStation ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'}`}>{p.isStation ? 'station' : 'plaats'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function sameSpot(a: Place, b: Place): boolean {
  return a.id === b.id || (Math.abs(a.lat - b.lat) < 0.002 && Math.abs(a.lon - b.lon) < 0.002)
}
