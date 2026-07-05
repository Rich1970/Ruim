// Live journey provider — adapter over the Transitous / MOTIS open API.
// Real timetables & routes across Europe (open GTFS data, no fares), mapped onto
// the Spoorwijs Journey model. Prices are estimated with the local fare model.
//
// In dev the browser calls the API same-origin via the Vite proxy (`/motis`),
// so there is no CORS problem. In production the same path must be proxied at
// the hosting/edge layer (or a small serverless function).

import type { Station, Leg, Journey, ServiceCategory, ReservationPolicy, OperatorInfo, CountryCode, SearchQuery, Place, AccessLeg } from './types'
import { OPERATORS } from './data'
import { computeFares, computeBookableFrom, standardFareForCategory, tagSuperlatives } from './planner'
import { shortName } from './searchParams'

const MOTIS_BASE = '/motis'
const TIMEOUT_MS = 9000

// --- timezone helpers ------------------------------------------------------
function tzOffsetMinutes(tz: string, utcMs: number): number {
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const p: Record<string, string> = {}
  for (const part of dtf.formatToParts(new Date(utcMs))) if (part.type !== 'literal') p[part.type] = part.value
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second)
  return Math.round((asUTC - utcMs) / 60000)
}

/** Local minutes-of-day + a day index for an instant, in a given timezone. */
function localInfo(iso: string, tz: string): { minutes: number; dayIndex: number } {
  const ms = Date.parse(iso)
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
  const p: Record<string, string> = {}
  for (const part of dtf.formatToParts(new Date(ms))) if (part.type !== 'literal') p[part.type] = part.value
  const minutes = ((+p.hour) % 24) * 60 + (+p.minute)
  const dayIndex = Math.floor(Date.UTC(+p.year, +p.month - 1, +p.day) / 86400000)
  return { minutes, dayIndex }
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLon = ((bLon - aLon) * Math.PI) / 180
  const la1 = (aLat * Math.PI) / 180
  const la2 = (bLat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

const COUNTRY_TZ: Record<string, string> = { GB: 'Europe/London', IE: 'Europe/Dublin', PT: 'Europe/Lisbon', GR: 'Europe/Athens', RO: 'Europe/Bucharest', BG: 'Europe/Sofia', FI: 'Europe/Helsinki', EE: 'Europe/Tallinn', LV: 'Europe/Riga', LT: 'Europe/Vilnius', UA: 'Europe/Kyiv' }
function queryTz(country: string | undefined): string { return (country && COUNTRY_TZ[country]) ?? 'Europe/Berlin' }

/** Convert a wall-clock (date + minutes-of-day) in tz to a UTC ISO instant. */
function wallToUtcISO(dateIso: string, minutes: number, tz: string): string {
  const [Y, M, D] = dateIso.split('-').map(Number)
  const h = Math.floor(minutes / 60), m = minutes % 60
  const guess = Date.UTC(Y, M - 1, D, h, m)
  const off = tzOffsetMinutes(tz, guess)
  return new Date(guess - off * 60000).toISOString()
}

const TZ_COUNTRY: Record<string, CountryCode> = {
  'Europe/London': 'GB', 'Europe/Athens': 'GR', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT',
  'Europe/Paris': 'FR', 'Europe/Brussels': 'BE', 'Europe/Amsterdam': 'NL', 'Europe/Berlin': 'DE',
  'Europe/Zurich': 'CH', 'Europe/Vienna': 'AT', 'Europe/Prague': 'CZ', 'Europe/Budapest': 'HU',
  'Europe/Copenhagen': 'DK', 'Europe/Luxembourg': 'LU', 'Europe/Ljubljana': 'SI', 'Europe/Zagreb': 'HR',
}

// --- mode / operator mapping ----------------------------------------------
function modeToCategory(mode: string): ServiceCategory {
  switch (mode) {
    case 'HIGHSPEED_RAIL': return 'hsr'
    case 'LONG_DISTANCE': return 'ic'
    case 'NIGHT_RAIL': return 'night'
    case 'FERRY': return 'ferry'
    case 'REGIONAL_RAIL': case 'REGIONAL_FAST_RAIL': case 'REGIONAL':
    case 'SUBWAY': case 'METRO': case 'TRAM': return 'regional'
    case 'BUS': case 'COACH': return 'ic'
    default: return 'ic'
  }
}

const GENERIC_COLORS = ['#3b6ea5', '#5a6b7b', '#8a5a44', '#4a7a5a', '#7a4a6a', '#40708a']
function genericOperator(name: string): OperatorInfo {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  const first = (name.split(/\s+/).filter(Boolean)[0] || name).replace(/[^A-Za-z0-9]/g, '')
  const short = (first.slice(0, 5) || 'TRN').toUpperCase()
  return {
    id: 'x-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24),
    name, short, color: GENERIC_COLORS[h % GENERIC_COLORS.length],
    country: 'NL', bookingWindowDays: 120, site: 'https://www.thetrainline.com',
  }
}

function operatorFor(agency: string, route = ''): OperatorInfo {
  const a = (agency || '').toLowerCase()
  const r = route.toLowerCase()
  if (/^(est|tha)\b/.test(r) || r.includes('eurostar') || r.includes('thalys')) return OPERATORS.eurostar
  if (a.includes('eurostar') || a.includes('thalys')) return OPERATORS.eurostar
  if (a.includes('ns international') || a === 'ns' || a.includes('nederlandse')) return OPERATORS.ns
  if (a.includes('sncf') || a.includes('ouigo') || a.includes('inoui') || a.includes('tgv') || a.includes('chemins de fer français') || a.includes('chemins de fer francais')) return OPERATORS.sncf
  if (a.includes('chemins de fer belge')) return OPERATORS.sncb
  if (a.includes('deutsche bahn') || a.includes('fernverkehr') || a === 'db' || a.startsWith('db ')) return OPERATORS.db
  if (a.includes('trenitalia') || a.includes('freccia')) return OPERATORS.trenitalia
  if (a.includes('italo')) return { ...OPERATORS.trenitalia, id: 'italo', name: 'Italo', short: 'Italo', color: '#b01e3c' }
  if (a.includes('renfe') || a.includes('ave')) return OPERATORS.renfe
  if (a.includes('nightjet')) return OPERATORS.nightjet
  if (a.includes('öbb') || a.includes('obb') || a.includes('railjet') || a.includes('österreich') || a.includes('bundesbahn')) return OPERATORS.oebb
  if (a.includes('trenord') || a.includes('lombard')) return { ...OPERATORS.trenitalia_ic, id: 'trenord', name: 'Trenord', short: 'Trenord', color: '#009a44' }
  if (a.includes('sbb') || a.includes('cff') || a.includes('ffs')) return OPERATORS.sbb
  if (a.includes('sncb') || a.includes('nmbs')) return OPERATORS.sncb
  if (a.includes('hellenic') || a.includes('trainose')) return OPERATORS.hellenic
  if (!agency) return genericOperator('Trein')
  return genericOperator(agency)
}

function reservationFor(category: ServiceCategory, opId: string): ReservationPolicy {
  if (opId === 'eurostar') return 'required'
  if (category === 'night' || category === 'ferry') return 'required'
  if (category === 'hsr') return ['sncf', 'trenitalia', 'renfe'].includes(opId) ? 'required' : 'recommended'
  if (category === 'ic') return 'optional'
  return 'optional'
}

// --- MOTIS response types (partial) ---------------------------------------
interface MotisStop {
  name: string; stopId?: string; lat: number; lon: number; tz?: string
  departure?: string; arrival?: string; track?: string
}
interface MotisLeg {
  mode: string; from: MotisStop; to: MotisStop
  startTime: string; endTime: string; distance?: number; duration?: number
  routeShortName?: string; tripShortName?: string; agencyName?: string
}
interface MotisItinerary { duration: number; transfers: number; startTime: string; endTime: string; legs: MotisLeg[] }
interface MotisPlan { itineraries?: MotisItinerary[] }

function toStation(s: MotisStop): Station {
  return {
    id: s.stopId || s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: s.name, city: s.name.replace(/\s+(Centraal|Hbf|Termini|Centrale|C\.le|Hauptbahnhof).*$/i, '').trim() || s.name,
    country: (s.tz && TZ_COUNTRY[s.tz]) || 'NL', lat: s.lat, lon: s.lon,
  }
}

function toAccessLeg(l: MotisLeg, placeName: string, stationSide: 'from' | 'to'): AccessLeg | undefined {
  const km = l.distance != null ? l.distance / 1000 : haversineKm(l.from.lat, l.from.lon, l.to.lat, l.to.lon)
  const mode: AccessLeg['mode'] = l.mode === 'CAR' ? 'CAR' : l.mode === 'BIKE' ? 'BIKE' : 'WALK'
  if (km < 0.8) return undefined
  const stationName = stationSide === 'to' ? l.to.name : l.from.name
  const minutes = l.duration != null ? Math.round(l.duration / 60) : Math.round((km / (mode === 'CAR' ? 46 : 4.8)) * 60)
  return { mode, km: Math.round(km), minutes: Math.max(1, minutes), placeName, stationName }
}

function buildLiveJourney(it: MotisItinerary, idx: number, q: SearchQuery): Journey | null {
  const isAccess = (l: MotisLeg) => l.from.name === 'START'
  const isEgress = (l: MotisLeg) => l.to.name === 'END'
  const transit = it.legs.filter((l) => !isAccess(l) && !isEgress(l) && l.mode !== 'WALK' && l.mode !== 'CAR' && l.mode !== 'BIKE')
  if (transit.length === 0) return null

  const baseTz = transit[0].from.tz || 'Europe/Berlin'
  const baseDay = localInfo(transit[0].from.departure || transit[0].startTime, baseTz).dayIndex

  const legs: Leg[] = transit.map((l) => {
    const from = toStation(l.from), to = toStation(l.to)
    const category = modeToCategory(l.mode)
    const operator = operatorFor(l.agencyName || '', l.routeShortName || '')
    const depISO = l.from.departure || l.startTime
    const arrISO = l.to.arrival || l.endTime
    const dep = localInfo(depISO, l.from.tz || baseTz)
    const arr = localInfo(arrISO, l.to.tz || baseTz)
    // MOTIS omits distance on transit legs → derive from endpoint coordinates.
    const km = Math.max(1, Math.round(haversineKm(l.from.lat, l.from.lon, l.to.lat, l.to.lon)))
    const touchesLondon = /london/i.test(from.name + to.name) || l.from.tz === 'Europe/London' || l.to.tz === 'Europe/London'
    const rs = (l.routeShortName || '').trim()
    const ts = (l.tripShortName || '').trim()
    const name = (rs && ts && rs.includes(ts) ? rs : [rs, ts].filter(Boolean).join(' ')).trim() || l.mode
    return {
      from, to, operator, category,
      depMin: dep.minutes, arrMin: arr.minutes,
      depDayOffset: dep.dayIndex - baseDay, arrDayOffset: arr.dayIndex - baseDay,
      durationMin: Math.max(1, Math.round((Date.parse(arrISO) - Date.parse(depISO)) / 60000)),
      km, reservation: reservationFor(category, operator.id),
      trainName: name.replace(/\s+/g, ' '),
      priceBase: standardFareForCategory(category, km, operator.id, touchesLondon),
    }
  })

  const first = legs[0], last = legs[legs.length - 1]
  const startMs = Date.parse(transit[0].from.departure || transit[0].startTime)
  const endMs = Date.parse(transit[transit.length - 1].to.arrival || transit[transit.length - 1].endTime)
  const durationMin = Math.round((endMs - startMs) / 60000)
  const km = legs.reduce((s, l) => s + l.km, 0)
  const tags: Journey['tags'] = []
  if (legs.length === 1) tags.push('direct')
  if (legs.some((l) => l.category === 'night' || l.category === 'ferry')) tags.push('night')

  const accessRaw = it.legs.find(isAccess)
  const egressRaw = it.legs.find(isEgress)
  let access = accessRaw ? toAccessLeg(accessRaw, shortName(q.from.name), 'to') : undefined
  let egress = egressRaw ? toAccessLeg(egressRaw, shortName(q.to.name), 'from') : undefined
  // If the endpoint is itself a station, a short hop is just MOTIS picking a
  // nearby station — don't confuse the traveller with a tiny "car" leg.
  if (q.from.isStation && access && access.km < 6) access = undefined
  if (q.to.isStation && egress && egress.km < 6) egress = undefined

  return {
    id: `live-${idx}-${first.depDayOffset * 1440 + first.depMin}`,
    legs,
    depMin: first.depMin, arrMin: last.arrMin, arrDayOffset: last.arrDayOffset,
    durationMin: Math.max(durationMin, 1), changes: legs.length - 1, km,
    fares: computeFares(legs, q.card), tags,
    bookableFrom: computeBookableFrom(legs, q.date),
    reservationRequired: legs.some((l) => l.reservation === 'required'),
    co2Kg: Math.round(km * 0.035), co2CarKg: Math.round(km * 0.17), co2PlaneKg: Math.round(km * 0.24),
    access, egress,
  }
}

export async function searchLive(q: SearchQuery): Promise<Journey[] | null> {
  const from = q.from
  const to = q.to
  if (!from || !to) return null
  const timeISO = wallToUtcISO(q.date, q.timePref, queryTz(from.country))
  const mt = q.minTransfer > 0 ? `&minTransferTime=${q.minTransfer}` : ''
  const url = `${MOTIS_BASE}/api/v1/plan?fromPlace=${from.lat},${from.lon}&toPlace=${to.lat},${to.lon}`
    + `&time=${encodeURIComponent(timeISO)}&arriveBy=false&transitModes=RAIL,FERRY`
    + `&preTransitModes=WALK,CAR&postTransitModes=WALK,CAR&maxPreTransitTime=5400&maxPostTransitTime=5400&numItineraries=6${mt}`

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } })
    if (!res.ok) return null
    const data: MotisPlan = await res.json()
    if (!data.itineraries || data.itineraries.length === 0) return null
    const journeys = data.itineraries
      .map((it, i) => buildLiveJourney(it, i, q))
      .filter((j): j is Journey => j !== null && j.legs.length > 0)
    if (journeys.length === 0) return null
    journeys.sort((a, b) => (a.depMin + a.legs[0].depDayOffset * 1440) - (b.depMin + b.legs[0].depDayOffset * 1440))
    tagSuperlatives(journeys)
    return journeys
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// --- geocoding (Europe-wide place search) ----------------------------------
const EUROPE = new Set([
  'NL', 'BE', 'LU', 'DE', 'FR', 'GB', 'IE', 'CH', 'AT', 'IT', 'ES', 'PT', 'GR', 'CZ', 'SK',
  'PL', 'HU', 'SI', 'HR', 'DK', 'SE', 'NO', 'FI', 'EE', 'LV', 'LT', 'RO', 'BG', 'RS', 'BA',
  'ME', 'MK', 'AL', 'LI', 'MC', 'SM', 'MT', 'CY', 'IS', 'XK',
])

interface MotisArea { name: string; adminLevel: number }
interface MotisMatch { type: string; name: string; id?: string; lat: number; lon: number; country?: string; areas?: MotisArea[] }

function pickRegion(areas: MotisArea[] | undefined, placeName: string): string | undefined {
  if (!Array.isArray(areas)) return undefined
  const region = areas.find((a) => a.adminLevel === 4) || areas.find((a) => a.adminLevel === 6)
  const country = areas.find((a) => a.adminLevel === 2)
  const parts = [region?.name, country?.name].filter((n): n is string => !!n && n !== placeName)
  return parts.length ? parts.join(', ') : undefined
}

export async function geocodePlaces(text: string): Promise<Place[]> {
  const query = text.trim()
  if (query.length < 2) return []
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 6000)
  try {
    const res = await fetch(`${MOTIS_BASE}/api/v1/geocode?text=${encodeURIComponent(query)}`, { signal: ctrl.signal, headers: { accept: 'application/json' } })
    if (!res.ok) return []
    const data: MotisMatch[] = await res.json()
    if (!Array.isArray(data)) return []
    const out: Place[] = []
    const seen = new Set<string>()
    for (const r of data) {
      if (!r || typeof r.lat !== 'number' || typeof r.lon !== 'number') continue
      if (r.country && !EUROPE.has(r.country)) continue
      const key = `${r.name}|${Math.round(r.lat * 40)}|${Math.round(r.lon * 40)}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({
        id: r.id || key, name: r.name, lat: r.lat, lon: r.lon,
        isStation: r.type === 'STOP', country: r.country, region: pickRegion(r.areas, r.name),
      })
      if (out.length >= 8) break
    }
    return out
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}
