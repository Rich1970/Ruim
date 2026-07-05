// Client adapter for the fase-2 booking aggregator (real prices + tickets).
//
// Mirrors the live/local provider contract: returns Journey[] on success, or
// null to signal "no result — fall back to the next provider". Backed by the
// /api/aggregator/* dev-server seam. While the partner integration is still
// scaffolding (no signed contract / response mapping), the backend returns an
// empty set and this resolves to null, so search transparently falls back.

import type { SearchQuery, Journey } from './types'
import { queryToParams } from './searchParams'

let configPromise: Promise<boolean> | null = null

/** Is a real aggregator partner configured on the backend? (cached) */
export function aggregatorEnabled(): Promise<boolean> {
  if (!configPromise) {
    configPromise = fetch('/api/aggregator/config')
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((j) => !!j.enabled)
      .catch(() => false)
  }
  return configPromise
}

export async function searchAggregator(q: SearchQuery): Promise<Journey[] | null> {
  if (!(await aggregatorEnabled())) return null
  try {
    const res = await fetch('/api/aggregator/search', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(queryToParams(q))),
    })
    if (!res.ok) return null
    const data = await res.json()
    const journeys: Journey[] = Array.isArray(data?.journeys) ? data.journeys : []
    return journeys.length > 0 ? journeys : null
  } catch {
    return null
  }
}
