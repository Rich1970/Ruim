import type {
  Station, Edge, Leg, Journey, Fare, FareClass, SearchQuery, JourneyTag, Place, AccessLeg,
} from './types'
import { STATION_MAP, EDGES, OPERATORS, nearestStation } from './data'
import { shortName } from './searchParams'
import { cardById, discountedLegFare } from './cards'

const WDAY_START = 300  // 05:00
const WDAY_END = 1380   // 23:00

// --- geometry --------------------------------------------------------------
function haversine(a: Station, b: Station): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h))))
}

function edgeKm(edge: Edge): number {
  if (edge.km) return edge.km
  return haversine(STATION_MAP[edge.from], STATION_MAP[edge.to])
}

function haversineC(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLon = ((bLon - aLon) * Math.PI) / 180
  const la1 = (aLat * Math.PI) / 180
  const la2 = (bLat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** First/last mile between a place and its nearest station (undefined if negligible). */
export function buildAccessLeg(place: Place, station: Station): AccessLeg | undefined {
  const km = haversineC(place.lat, place.lon, station.lat, station.lon)
  if (km < 0.8) return undefined
  const mode: AccessLeg['mode'] = km <= 1.6 ? 'WALK' : 'CAR'
  const speed = mode === 'WALK' ? 4.8 : 46
  return {
    mode, km: Math.round(km), minutes: Math.max(2, Math.round((km / speed) * 60)),
    placeName: shortName(place.name), stationName: station.name,
  }
}

// --- graph -----------------------------------------------------------------
interface DirEdge extends Edge { realFrom: string; realTo: string }
const ADJ: Record<string, DirEdge[]> = {}
for (const edge of EDGES) {
  ;(ADJ[edge.from] ||= []).push({ ...edge, realFrom: edge.from, realTo: edge.to })
  ;(ADJ[edge.to] ||= []).push({
    ...edge, from: edge.to, to: edge.from, realFrom: edge.from, realTo: edge.to,
  })
}

// --- fares -----------------------------------------------------------------
const KM_RATE: Record<Edge['category'], number> = {
  hsr: 0.2, ic: 0.13, regional: 0.09, night: 0.16, ferry: 0, transfer: 0,
}
const MIN_FARE: Record<Edge['category'], number> = {
  hsr: 15, ic: 7, regional: 4, night: 55, ferry: 58, transfer: 0,
}

/** Standard 2nd-class base fare for a leg of a given category & distance. */
export function standardFareForCategory(
  category: Edge['category'], km: number, operatorId?: string, touchesLondon = false,
): number {
  if (category === 'ferry') return 62
  let fare = km * KM_RATE[category]
  if (operatorId === 'eurostar') {
    fare = Math.max(km * 0.24, 39)
    if (touchesLondon) fare = Math.max(fare, 49)
  }
  return Math.max(Math.round(fare), MIN_FARE[category])
}

/** Standard 2nd-class base fare for one network edge. */
function legStandardFare(edge: Edge, km: number): number {
  return standardFareForCategory(edge.category, km, edge.operator, edge.from === 'london' || edge.to === 'london')
}

function reservationFee(edge: Edge): number {
  if (edge.operator === 'eurostar') return 32
  if (edge.category === 'ferry') return 45
  if (edge.category === 'night') return 35
  if (edge.reservation === 'required') return 13
  if (edge.reservation === 'recommended') return 4.5
  return 0
}

// --- timetable synthesis ---------------------------------------------------
function dayGrid(edge: Edge): number[] {
  if (edge.fixedDep) return [...edge.fixedDep].sort((a, b) => a - b)
  const freq = Math.min(edge.freqPerDay, 60)
  if (freq <= 1) return [WDAY_START]
  const step = (WDAY_END - WDAY_START) / (freq - 1)
  const out: number[] = []
  for (let i = 0; i < freq; i++) out.push(Math.round((WDAY_START + i * step) / 5) * 5)
  return out
}

/** Absolute minute of the next departure of `edge` at/after `afterAbs`. */
function nextDepartureAbs(edge: Edge, afterAbs: number): number {
  const grid = dayGrid(edge)
  const baseDay = Math.floor(afterAbs / 1440)
  for (let k = 0; k < 4; k++) {
    const dayStart = (baseDay + k) * 1440
    for (const d of grid) {
      const t = dayStart + d
      if (t >= afterAbs) return t
    }
  }
  return (baseDay + 4) * 1440 + grid[0]
}

function transferBuffer(prev: DirEdge, next: DirEdge): number {
  const intlHub =
    STATION_MAP[prev.to].country !== STATION_MAP[prev.from].country ||
    STATION_MAP[next.to].country !== STATION_MAP[next.from].country
  let buf = 12
  if (intlHub || prev.category === 'hsr' || next.category === 'hsr') buf = 20
  if (next.operator === 'eurostar' || prev.operator === 'eurostar') buf = 45
  if (next.category === 'ferry') buf = 90
  if (next.category === 'night') buf = 30
  return buf
}

// --- pathfinding (Dijkstra over a weight fn) -------------------------------
type WeightFn = (edge: DirEdge, hopIndex: number) => number

function dijkstra(fromId: string, toId: string, weight: WeightFn): string[] | null {
  const dist: Record<string, number> = {}
  const prev: Record<string, { node: string } | null> = {}
  const hops: Record<string, number> = {}
  const visited = new Set<string>()
  for (const id of Object.keys(STATION_MAP)) dist[id] = Infinity
  dist[fromId] = 0
  hops[fromId] = 0
  prev[fromId] = null

  while (true) {
    let u: string | null = null
    let best = Infinity
    for (const id of Object.keys(dist)) {
      if (!visited.has(id) && dist[id] < best) { best = dist[id]; u = id }
    }
    if (u === null) break
    if (u === toId) break
    visited.add(u)
    for (const edge of ADJ[u] || []) {
      const w = weight(edge, hops[u])
      const nd = dist[u] + w
      if (nd < dist[edge.to]) {
        dist[edge.to] = nd
        prev[edge.to] = { node: u }
        hops[edge.to] = hops[u] + 1
      }
    }
  }
  if (dist[toId] === Infinity) return null
  const path: string[] = []
  let cur: string | null = toId
  while (cur) { path.unshift(cur); cur = prev[cur]?.node ?? null }
  return path
}

function edgeBetween(a: string, b: string): DirEdge {
  return (ADJ[a] || []).find((e) => e.to === b)!
}

// --- journey assembly ------------------------------------------------------
function hashNum(s: string, mod: number): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % mod
}

function trainName(edge: DirEdge): string {
  const op = OPERATORS[edge.operator]
  const n = 100 + hashNum(edge.realFrom + edge.realTo + edge.operator, 8900)
  const prefix: Record<string, string> = {
    ns: 'IC', eurostar: 'ES', sncb: 'IC', sncf: 'TGV', ter: 'TER', db: edge.category === 'hsr' ? 'ICE' : 'IC',
    sbb: 'EC', oebb: 'RJ', nightjet: 'NJ', trenitalia: 'FR', trenitalia_ic: 'IC', renfe: 'AVE',
    hellenic: 'IC', ferry: 'Ferry', cd: 'EC',
  }
  if (edge.operator === 'ferry') return 'Nachtveerboot Bari–Patras'
  return `${prefix[edge.operator] ?? op.short} ${n}`
}

function buildJourney(path: string[], anchorAbs: number, q: SearchQuery): Journey | null {
  if (path.length < 2) return null
  const legs: Leg[] = []
  let cursor = anchorAbs
  let prevEdge: DirEdge | null = null

  for (let i = 0; i < path.length - 1; i++) {
    const edge = edgeBetween(path[i], path[i + 1])
    if (!edge) return null
    let depAbs: number
    if (!prevEdge) {
      // First leg departs at a real timetabled slot at/after the anchor.
      depAbs = nextDepartureAbs(edge, cursor)
    } else {
      const buffer = Math.max(transferBuffer(prevEdge, edge), q.minTransfer || 0)
      if (edge.fixedDep) {
        // Night trains / ferries only run at fixed times — wait for the next one.
        depAbs = nextDepartureAbs(edge, cursor + buffer)
      } else {
        // Daytime legs are timed connections: leave shortly after the transfer.
        depAbs = Math.round((cursor + buffer + 5) / 5) * 5
      }
    }
    const arrAbs = depAbs + edge.minutes
    const from = STATION_MAP[edge.from]
    const to = STATION_MAP[edge.to]
    const km = edgeKm(edge)
    legs.push({
      from, to,
      operator: OPERATORS[edge.operator],
      category: edge.category,
      depMin: depAbs % 1440,
      arrMin: arrAbs % 1440,
      depDayOffset: Math.floor(depAbs / 1440),
      arrDayOffset: Math.floor(arrAbs / 1440),
      durationMin: edge.minutes,
      km,
      reservation: edge.reservation,
      trainName: trainName(edge),
      priceBase: legStandardFare(edge, km),
    })
    cursor = arrAbs
    prevEdge = edge
  }

  const first = legs[0]
  const last = legs[legs.length - 1]
  const depAbs = first.depDayOffset * 1440 + first.depMin
  const arrAbs = last.arrDayOffset * 1440 + last.arrMin
  const durationMin = arrAbs - depAbs
  const km = legs.reduce((s, l) => s + l.km, 0)

  const fares = computeFares(legs, q.card)
  const reservationRequired = legs.some((l) => l.reservation === 'required')
  const tags: JourneyTag[] = []
  if (legs.length === 1) tags.push('direct')
  if (legs.some((l) => l.category === 'night' || l.category === 'ferry')) tags.push('night')

  const co2Kg = Math.round(km * 0.035)
  const co2CarKg = Math.round(km * 0.17)
  const co2PlaneKg = Math.round(km * 0.24)

  return {
    id: `${path.join('-')}@${depAbs}`,
    legs,
    depMin: first.depMin,
    arrMin: last.arrMin,
    arrDayOffset: last.arrDayOffset,
    durationMin,
    changes: legs.length - 1,
    km,
    fares,
    tags,
    bookableFrom: computeBookableFrom(legs, q.date),
    reservationRequired,
    co2Kg, co2CarKg, co2PlaneKg,
  }
}

export function computeFares(legs: Leg[], cardId: string): Record<FareClass, Fare> {
  const card = cardById(cardId)
  if (card.reservationsOnly) {
    const fee = Math.max(
      0,
      Math.round(legs.reduce((s, l) => s + reservationFeeFromLeg(l), 0)),
    )
    const mk = (cls: FareClass): Fare => ({
      cls, price: fee, refundable: cls === 'flex', changeable: cls !== 'saver', seatIncluded: true,
    })
    return { saver: mk('saver'), standard: mk('standard'), flex: mk('flex') }
  }
  let base = legs.reduce((s, l) => s + discountedLegFare(l.priceBase, l.operator.id, card), 0)
  base = Math.max(base, 6)
  return {
    saver: { cls: 'saver', price: Math.round(base * 0.6), refundable: false, changeable: false, seatIncluded: true },
    standard: { cls: 'standard', price: Math.round(base), refundable: false, changeable: true, seatIncluded: true },
    flex: { cls: 'flex', price: Math.round(base * 1.45), refundable: true, changeable: true, seatIncluded: true },
  }
}

function reservationFeeFromLeg(l: Leg): number {
  if (l.operator.id === 'eurostar') return 32
  if (l.category === 'ferry') return 45
  if (l.category === 'night') return 35
  if (l.reservation === 'required') return 13
  if (l.reservation === 'recommended') return 4.5
  return 0
}

export function computeBookableFrom(legs: Leg[], travelDateIso: string): string | undefined {
  const travel = new Date(travelDateIso + 'T00:00:00')
  let earliest = 0
  for (const l of legs) {
    if (l.operator.bookingWindowDays > earliest) earliest = l.operator.bookingWindowDays
  }
  // Booking opens the SMALLEST window ahead (the most restrictive operator).
  let mostRestrictive = Infinity
  for (const l of legs) mostRestrictive = Math.min(mostRestrictive, l.operator.bookingWindowDays)
  if (!isFinite(mostRestrictive)) return undefined
  const opens = new Date(travel.getTime() - mostRestrictive * 86400000)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (opens.getTime() > today.getTime()) return opens.toISOString().slice(0, 10)
  return undefined
}

// --- top-level search ------------------------------------------------------
export interface SearchResult {
  journeys: Journey[]
  from: Place
  to: Place
}

export function planJourneys(q: SearchQuery): SearchResult {
  const fromSt = nearestStation(q.from.lat, q.from.lon)
  const toSt = nearestStation(q.to.lat, q.to.lon)
  const from = q.from
  const to = q.to
  const access = buildAccessLeg(q.from, fromSt)
  const egress = buildAccessLeg(q.to, toSt)
  const anchor = q.timePref // day 0

  const timeWeight: WeightFn = (e, hop) => e.minutes + (hop > 0 ? 40 : 0)
  const costWeight: WeightFn = (e) => legStandardFare(e, edgeKm(e)) * 0.6 + 3
  const hopWeight: WeightFn = () => 1
  const nightWeight: WeightFn = (e) =>
    (e.category === 'night' || e.category === 'ferry' ? e.minutes * 0.3 : e.minutes) + 10

  const paths: string[][] = []
  const seen = new Set<string>()
  const addPath = (p: string[] | null) => {
    if (!p) return
    const key = p.join('>')
    if (!seen.has(key)) { seen.add(key); paths.push(p) }
  }
  addPath(dijkstra(fromSt.id, toSt.id, timeWeight))
  addPath(dijkstra(fromSt.id, toSt.id, costWeight))
  addPath(dijkstra(fromSt.id, toSt.id, hopWeight))
  addPath(dijkstra(fromSt.id, toSt.id, nightWeight))

  if (paths.length === 0) return { journeys: [], from, to }

  const destCountry = toSt.country
  const journeys: Journey[] = []
  const pushJourney = (j: Journey | null) => {
    if (!j) return
    // Reject unrealistic double-night / double-ferry chains (unless heading to Greece).
    const nightLegs = j.legs.filter((l) => l.category === 'night' || l.category === 'ferry').length
    if (nightLegs > 1 && destCountry !== 'GR') return
    if (!journeys.some((x) => x.id === j.id)) journeys.push(j)
  }

  const genDepartures = (path: string[], count: number): number[] => {
    const firstEdge = edgeBetween(path[0], path[1])
    const inVehicle = path.slice(0, -1).reduce((s, _, i) => s + edgeBetween(path[i], path[i + 1]).minutes, 0)
    // Long journeys should start in the morning so middle legs stay within service hours.
    const capMin = inVehicle > 360 ? 13 * 60 : 19 * 60
    const out: number[] = []
    let after = anchor
    for (let i = 0; i < 12 && out.length < count; i++) {
      const d = nextDepartureAbs(firstEdge, after)
      after = d + 1
      if (d >= 1440) break // keep same-day departures only
      if (!firstEdge.fixedDep && d % 1440 > capMin) continue
      out.push(d)
    }
    if (out.length === 0) out.push(nextDepartureAbs(firstEdge, anchor))
    return out
  }

  // Fastest path: a few departures across the (day)time.
  for (const d of genDepartures(paths[0], 3)) pushJourney(buildJourney(paths[0], d, q))
  // Other distinct paths: the best departure each.
  for (const p of paths.slice(1)) {
    for (const d of genDepartures(p, 1)) pushJourney(buildJourney(p, d, q))
  }

  // Attach first/last mile (car/walk from the place to its nearest station).
  for (const j of journeys) { if (access) j.access = access; if (egress) j.egress = egress }

  // Sort by departure absolute time.
  journeys.sort((a, b) => (a.depMin + a.legs[0].depDayOffset * 1440) - (b.depMin + b.legs[0].depDayOffset * 1440))

  // Tag cheapest / fastest / fewest across the set.
  tagSuperlatives(journeys)
  return { journeys, from, to }
}

export function tagSuperlatives(js: Journey[]) {
  if (js.length === 0) return
  const cheapest = js.reduce((a, b) => (b.fares.saver.price < a.fares.saver.price ? b : a))
  const fastest = js.reduce((a, b) => (b.durationMin < a.durationMin ? b : a))
  const fewest = js.reduce((a, b) => (b.changes < a.changes ? b : a))
  if (!cheapest.tags.includes('cheapest')) cheapest.tags.push('cheapest')
  if (!fastest.tags.includes('fastest')) fastest.tags.push('fastest')
  if (!fewest.tags.includes('fewest')) fewest.tags.push('fewest')
}

// --- helpers exported for UI ----------------------------------------------
export function fmtTime(min: number): string {
  const h = Math.floor((min % 1440) / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}u ${String(m).padStart(2, '0')}m` : `${m}m`
}

export function buyUrl(leg: Leg): string {
  return leg.operator.site
}
