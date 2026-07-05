import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlaceSearch } from './PlaceSearch'
import { useApp } from '../state/store'
import { IconSwap, IconArrowRight, IconCalendar, IconClock, IconUser } from './icons'
import { queryToParams, todayIso, addDaysIso } from '../engine/searchParams'
import { STATION_MAP, stationToPlace } from '../engine/data'
import { DISCOUNT_CARDS, CARD_COUNTRIES } from '../engine/cards'
import type { SearchQuery, Place } from '../engine/types'

const DEFAULT_FROM = stationToPlace(STATION_MAP['amsterdam'])
const DEFAULT_TO = stationToPlace(STATION_MAP['naples'])

export function SearchForm({ initial }: { initial?: Partial<SearchQuery> }) {
  const { t, user } = useApp()
  const nav = useNavigate()
  const [from, setFrom] = useState<Place>(initial?.from ?? DEFAULT_FROM)
  const [to, setTo] = useState<Place>(initial?.to ?? DEFAULT_TO)
  const [date, setDate] = useState(initial?.date ?? addDaysIso(todayIso(), 30))
  const [time, setTime] = useState(initial?.timePref ?? 480)
  const [pax, setPax] = useState(initial?.passengers ?? 1)
  const [card, setCard] = useState<SearchQuery['card']>(initial?.card ?? (user?.card as any) ?? 'none')
  const [minTransfer, setMinTransfer] = useState(initial?.minTransfer ?? 0)

  function swap() { setFrom(to); setTo(from) }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (sameSpot(from, to)) return
    const q: SearchQuery = { from, to, date, timePref: time, passengers: pax, card, minTransfer }
    nav(`/results?${queryToParams(q).toString()}`)
  }

  return (
    <form onSubmit={submit} className="card p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <PlaceSearch value={from} onChange={setFrom} label={t('from')} exclude={to} placeholder="Amsterdam…" />
        <div className="flex items-end justify-center pb-1">
          <button type="button" onClick={swap} className="btn-ghost !rounded-full !p-2.5" title={t('swap')} aria-label={t('swap')}>
            <IconSwap width={18} height={18} />
          </button>
        </div>
        <PlaceSearch value={to} onChange={setTo} label={t('to')} exclude={from} placeholder="Elke plaats in Europa…" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Field label={t('date')} icon={<IconCalendar width={17} height={17} />}>
          <input type="date" className="field pl-9" value={date} min={todayIso()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t('depart_after')} icon={<IconClock width={17} height={17} />}>
          <select className="field pl-9 appearance-none" value={time} onChange={(e) => setTime(Number(e.target.value))}>
            {Array.from({ length: 20 }, (_, i) => 6 * 60 + i * 60).map((m) => (
              <option key={m} value={m}>{String(Math.floor(m / 60)).padStart(2, '0')}:00</option>
            ))}
          </select>
        </Field>
        <Field label={t('passengers')} icon={<IconUser width={17} height={17} />}>
          <select className="field pl-9 appearance-none" value={pax} onChange={(e) => setPax(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label={t('discount')}>
          <select className="field appearance-none" value={card} onChange={(e) => setCard(e.target.value)}>
            <option value="none">{DISCOUNT_CARDS[0].name}</option>
            {CARD_COUNTRIES.map((c) => (
              <optgroup key={c.code} label={c.label}>
                {DISCOUNT_CARDS.filter((d) => d.id !== 'none' && d.country === c.code).map((d) => (
                  <option key={d.id} value={d.id}>{d.flag} {d.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label={t('transfer_time')}>
          <select className="field appearance-none" value={minTransfer} onChange={(e) => setMinTransfer(Number(e.target.value))}>
            <option value={0}>{t('tt_standard')}</option>
            <option value={20}>{t('tt_roomy')}</option>
            <option value={30}>{t('tt_xroomy')}</option>
          </select>
        </Field>
      </div>

      <button type="submit" className="btn-primary mt-4 w-full !py-3 text-base" disabled={sameSpot(from, to)}>
        {t('search')} <IconArrowRight width={18} height={18} />
      </button>
    </form>
  )
}

function sameSpot(a: Place, b: Place): boolean {
  return a.id === b.id || (Math.abs(a.lat - b.lat) < 0.002 && Math.abs(a.lon - b.lon) < 0.002)
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="label mb-1.5 block">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500">{icon}</span>}
        {children}
      </div>
    </div>
  )
}
