import React, { useMemo, useRef, useState, useEffect } from 'react'
import { STATIONS } from '../engine/data'
import type { Station } from '../engine/types'
import { IconPin } from './icons'

const COUNTRY_FLAG: Record<string, string> = {
  NL: '🇳🇱', BE: '🇧🇪', GB: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪', CH: '🇨🇭', AT: '🇦🇹',
  IT: '🇮🇹', ES: '🇪🇸', GR: '🇬🇷', CZ: '🇨🇿', HU: '🇭🇺', SI: '🇸🇮', HR: '🇭🇷', DK: '🇩🇰', LU: '🇱🇺',
}

export function StationSelect({
  value, onChange, label, placeholder, exclude,
}: {
  value: string
  onChange: (id: string) => void
  label: string
  placeholder?: string
  exclude?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  const selected = STATIONS.find((s) => s.id === value)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = STATIONS.filter((s) => s.id !== exclude)
    if (!q) return list.slice(0, 60)
    return list
      .filter((s) => s.city.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.country.toLowerCase() === q)
      .slice(0, 40)
  }, [query, exclude])

  function pick(s: Station) {
    onChange(s.id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="label mb-1.5 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500"><IconPin width={18} height={18} /></span>
        <input
          className="field pl-9"
          placeholder={placeholder}
          value={open ? query : selected ? `${selected.city} · ${selected.name}` : ''}
          onFocus={() => { setOpen(true); setQuery('') }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0) }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, matches.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
            else if (e.key === 'Enter' && matches[active]) { e.preventDefault(); pick(matches[active]) }
            else if (e.key === 'Escape') setOpen(false)
          }}
          aria-label={label}
          role="combobox"
          aria-expanded={open}
        />
      </div>
      {open && (
        <div className="absolute z-30 mt-1.5 w-full max-h-72 overflow-y-auto rounded-xl border border-brand-100 bg-white shadow-lift">
          {matches.length === 0 && <div className="px-3.5 py-3 text-sm text-ink-faint">Geen station gevonden</div>}
          {matches.map((s, i) => (
            <button
              key={s.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(s)}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm ${i === active ? 'bg-brand-50' : ''}`}
            >
              <span className="text-base leading-none">{COUNTRY_FLAG[s.country] ?? '🚄'}</span>
              <span className="flex-1">
                <span className="font-semibold text-ink">{s.city}</span>
                <span className="ml-1.5 text-ink-faint">{s.name}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { COUNTRY_FLAG }
