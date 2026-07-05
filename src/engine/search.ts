import { useEffect, useRef, useState } from 'react'
import type { SearchQuery, Journey, Place } from './types'
import { planJourneys } from './planner'
import { searchLive } from './live'
import { searchAggregator } from './aggregator'
import { queryToParams } from './searchParams'

export type SearchSource = 'aggregator' | 'live' | 'local'

export interface Outcome {
  journeys: Journey[]
  source: SearchSource
  from: Place
  to: Place
}

const cache = new Map<string, Outcome>()

export function cacheKey(q: SearchQuery): string {
  return queryToParams(q).toString()
}

export function getCached(q: SearchQuery): Outcome | undefined {
  return cache.get(cacheKey(q))
}

export async function runSearch(q: SearchQuery): Promise<Outcome> {
  const key = cacheKey(q)
  const hit = cache.get(key)
  if (hit) return hit

  let outcome: Outcome | null = null

  // Provider chain, best data first. Each returns null/empty to fall through.
  // 1) Booking aggregator — real prices & bookable tickets (fase 2; only active
  //    once a partner key is configured, otherwise a no-op that falls through).
  const agg = await searchAggregator(q)
  if (agg && agg.length > 0) {
    outcome = { journeys: agg, source: 'aggregator', from: q.from, to: q.to }
  }

  // 2) Live open-data timetables (Transitous / MOTIS). Real times & routes.
  if (!outcome) {
    const live = await searchLive(q)
    if (live && live.length > 0) {
      outcome = { journeys: live, source: 'live', from: q.from, to: q.to }
    }
  }

  // 3) Fallback: the built-in Spoorwijs planner (always available).
  if (!outcome) {
    const r = planJourneys(q)
    outcome = { journeys: r.journeys, source: 'local', from: r.from, to: r.to }
  }

  cache.set(key, outcome)
  return outcome
}

/** React hook: resolves a search, using the shared cache for instant navigation. */
export function useSearch(q: SearchQuery | null): { loading: boolean; outcome: Outcome | null } {
  const [state, setState] = useState<{ loading: boolean; outcome: Outcome | null }>(() => {
    const cached = q ? getCached(q) : undefined
    return { loading: !!q && !cached, outcome: cached ?? null }
  })
  const reqId = useRef(0)

  const key = q ? cacheKey(q) : ''
  useEffect(() => {
    if (!q) { setState({ loading: false, outcome: null }); return }
    const cached = getCached(q)
    if (cached) { setState({ loading: false, outcome: cached }); return }
    const id = ++reqId.current
    setState({ loading: true, outcome: null })
    runSearch(q).then((o) => {
      if (id === reqId.current) setState({ loading: false, outcome: o })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}
