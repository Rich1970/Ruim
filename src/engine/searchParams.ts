import type { SearchQuery, Place } from './types'

function placeEntries(p: Place, prefix: 'from' | 'to'): [string, string][] {
  return [
    [prefix, `${p.lat}|${p.lon}|${p.isStation ? 1 : 0}|${p.id}`],
    [prefix + 'N', p.name],
    [prefix + 'C', p.country ?? ''],
    [prefix + 'R', p.region ?? ''],
  ]
}

export function queryToParams(q: SearchQuery): URLSearchParams {
  const sp = new URLSearchParams()
  for (const [k, v] of placeEntries(q.from, 'from')) sp.set(k, v)
  for (const [k, v] of placeEntries(q.to, 'to')) sp.set(k, v)
  sp.set('date', q.date)
  sp.set('time', String(q.timePref))
  sp.set('pax', String(q.passengers))
  sp.set('card', q.card)
  sp.set('mt', String(q.minTransfer || 0))
  return sp
}

function readPlace(p: URLSearchParams, prefix: 'from' | 'to'): Place | null {
  const base = p.get(prefix)
  const name = p.get(prefix + 'N')
  if (!base || !name) return null
  const parts = base.split('|')
  const lat = Number(parts[0]), lon = Number(parts[1])
  const isStation = parts[2] === '1'
  const id = parts.slice(3).join('|') || name
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return {
    id, name, lat, lon, isStation,
    country: p.get(prefix + 'C') || undefined,
    region: p.get(prefix + 'R') || undefined,
  }
}

export function paramsToQuery(p: URLSearchParams): SearchQuery | null {
  const from = readPlace(p, 'from')
  const to = readPlace(p, 'to')
  if (!from || !to) return null
  return {
    from, to,
    date: p.get('date') || todayIso(),
    timePref: Number(p.get('time') ?? 480),
    passengers: Math.max(1, Number(p.get('pax') ?? 1)),
    card: (p.get('card') as SearchQuery['card']) || 'none',
    minTransfer: Math.max(0, Number(p.get('mt') ?? 0)),
  }
}

const STATION_SUFFIX = /\s+(Centraal|Central|Centrale|C\.le|Hbf\.?|Hauptbahnhof|Termini|St Pancras.*|Sants|Atocha.*|Part-Dieu|Santa Lucia|Porta Nuova|Porta Garibaldi|Nord|Est|Sud|SBB|HB|Glavni|hlavní.*|Keleti|H\.?$).*$/i

/** City-level label for headers, e.g. "Amsterdam Centraal" -> "Amsterdam". */
export function shortName(name: string): string {
  // Drop a parenthetical qualifier FIRST — it can itself contain the " / "
  // separators (e.g. "Paris (Nord / Lyon / Est)"), which would otherwise leave a
  // dangling "(" after the split below.
  const noParen = name.replace(/\s*\(.*$/, '').trim()
  const base = (noParen || name).split(/\s[·/]\s|\s\/\s/)[0]
  const trimmed = base.replace(STATION_SUFFIX, '').trim()
  return trimmed || base || name
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function fmtDateNL(iso: string, lang: 'nl' | 'en'): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}
