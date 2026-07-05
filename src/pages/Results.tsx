import React, { useMemo, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../state/store'
import { useSearch, type SearchSource } from '../engine/search'
import { paramsToQuery, fmtDateNL, shortName } from '../engine/searchParams'
import type { Journey } from '../engine/types'
import { JourneyCard } from '../components/JourneyCard'
import { SearchForm } from '../components/SearchForm'
import { Segmented, Spinner } from '../components/bits'
import { IconArrowRight, IconTrain } from '../components/icons'

type Sort = 'depart' | 'duration' | 'price' | 'changes'
type Filter = 'all' | 'direct' | 'nonight'

function matchesFilter(j: Journey, f: Filter): boolean {
  if (f === 'direct') return j.changes === 0
  if (f === 'nonight') return !j.legs.some((l) => l.category === 'night' || l.category === 'ferry')
  return true
}

export function Results() {
  const { t, lang } = useApp()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [sort, setSort] = useState<Sort>('depart')
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState(false)

  const q = paramsToQuery(params)
  const { loading, outcome } = useSearch(q)
  const journeys = useMemo(() => (outcome ? sortJourneys(outcome.journeys, sort) : []), [outcome, sort])
  const filtered = useMemo(() => journeys.filter((j) => matchesFilter(j, filter)), [journeys, filter])

  if (!q) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ink-soft">Ongeldige zoekopdracht. <Link className="text-brand-600 underline" to="/">Terug naar zoeken</Link></div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:py-7">
      <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><IconTrain /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-lg font-extrabold text-ink">
              <span className="truncate">{outcome ? shortName(outcome.from.name) : shortName(q.from.name)}</span>
              <IconArrowRight width={17} height={17} className="shrink-0 text-ink-faint" />
              <span className="truncate">{outcome ? shortName(outcome.to.name) : shortName(q.to.name)}</span>
            </div>
            <div className="text-sm text-ink-faint">{fmtDateNL(q.date, lang)} · {q.passengers} {q.passengers === 1 ? 'reiziger' : 'reizigers'}</div>
          </div>
          <button onClick={() => setEditing((v) => !v)} className="btn-subtle !py-2">{editing ? 'Sluiten' : 'Wijzig'}</button>
        </div>
        {editing && <div className="mt-4"><SearchForm initial={q} /></div>}
      </div>

      {!loading && outcome && <SourceBadge source={outcome.source} />}

      <div className="mt-4 flex items-center justify-between gap-3">
        <h1 className="text-sm font-bold uppercase tracking-wide text-ink-faint">{t('results_title')}{!loading && ` · ${filtered.length}`}</h1>
        <div className="scroll-x -mr-4 overflow-x-auto pr-4">
          <Segmented<Sort>
            value={sort}
            onChange={setSort}
            options={[
              { value: 'depart', label: t('sort_depart') },
              { value: 'duration', label: t('sort_duration') },
              { value: 'price', label: t('sort_price') },
              { value: 'changes', label: t('sort_changes') },
            ]}
          />
        </div>
      </div>

      {!loading && journeys.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(['all', 'direct', 'nonight'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`chip border transition ${filter === f ? 'border-brand-300 bg-brand-100 text-brand-700' : 'border-brand-100 bg-white text-ink-soft hover:bg-brand-50'}`}
            >
              {t(f === 'all' ? 'filter_all' : f === 'direct' ? 'filter_direct' : 'filter_nonight')}
            </button>
          ))}
        </div>
      )}

      {!loading && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-xs font-semibold text-ink-faint">{t('transfer_time')}:</span>
          {([[0, 'tt_standard'], [20, 'tt_roomy'], [30, 'tt_xroomy']] as [number, string][]).map(([v, k]) => (
            <button
              key={v}
              onClick={() => { const sp = new URLSearchParams(params); sp.set('mt', String(v)); nav(`/results?${sp.toString()}`) }}
              className={`chip border transition ${(q.minTransfer || 0) === v ? 'border-brand-300 bg-brand-100 text-brand-700' : 'border-brand-100 bg-white text-ink-soft hover:bg-brand-50'}`}
            >
              {t(k as any)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2 px-1 py-2 text-sm text-ink-soft"><Spinner className="text-brand-500" /> {t('searching')}</div>
          {[0, 1, 2].map((i) => <div key={i} className="card h-28 animate-pulse bg-brand-50/40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card mt-3 p-8 text-center text-ink-soft">{journeys.length === 0 ? t('results_none') : t('filter_none_match')}</div>
      ) : (
        <div className="mt-3 space-y-3">
          {filtered.map((j) => (
            <JourneyCard
              key={j.id}
              j={j}
              passengers={q.passengers}
              onOpen={() => nav(`/journey?${params.toString()}&j=${encodeURIComponent(j.id)}`)}
            />
          ))}
        </div>
      )}

      <p className="mt-6 px-1 text-xs leading-relaxed text-ink-faint">
        Afrekenen gebeurt veilig bij de vervoerder zelf via de knop op de reisdetailpagina.
      </p>
    </div>
  )
}

function SourceBadge({ source }: { source: SearchSource }) {
  const { t } = useApp()
  const titleKey = source === 'aggregator' ? 'src_aggregator' : source === 'live' ? 'src_live' : 'src_local'
  const hintKey = source === 'aggregator' ? 'src_aggregator_hint' : source === 'live' ? 'src_live_hint' : 'src_local_hint'
  const emphasize = source === 'aggregator' || source === 'live'
  return (
    <div className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${emphasize ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-brand-100 bg-brand-50/60 text-ink-soft'}`}>
      <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${emphasize ? 'bg-emerald-500' : 'bg-brand-400'}`} />
      <span><span className="font-bold">{t(titleKey)}</span> — {t(hintKey)}</span>
    </div>
  )
}

function sortJourneys(js: Journey[], sort: Sort): Journey[] {
  const arr = [...js]
  switch (sort) {
    case 'duration': return arr.sort((a, b) => a.durationMin - b.durationMin)
    case 'price': return arr.sort((a, b) => a.fares.saver.price - b.fares.saver.price)
    case 'changes': return arr.sort((a, b) => a.changes - b.changes || a.durationMin - b.durationMin)
    default: return arr.sort((a, b) => (a.depMin + a.legs[0].depDayOffset * 1440) - (b.depMin + b.legs[0].depDayOffset * 1440))
  }
}
