import React from 'react'
import { STATIONS, EDGES, STATION_MAP } from '../engine/data'

interface Pt { lat: number; lon: number; city?: string; name?: string }

// --- projection (equirectangular, longitude compressed by cos(mean lat)) ----
const LATS = STATIONS.map((s) => s.lat)
const LONS = STATIONS.map((s) => s.lon)
const MIN_LAT = Math.min(...LATS), MAX_LAT = Math.max(...LATS)
const MIN_LON = Math.min(...LONS), MAX_LON = Math.max(...LONS)
const KX = Math.cos(((MIN_LAT + MAX_LAT) / 2) * Math.PI / 180)
const RANGE_LON = (MAX_LON - MIN_LON) * KX
const RANGE_LAT = MAX_LAT - MIN_LAT
const PAD = 26
const H = 520
const W = Math.round((H - 2 * PAD) * (RANGE_LON / RANGE_LAT) + 2 * PAD)

function project(lat: number, lon: number): [number, number] {
  const x = PAD + (((lon - MIN_LON) * KX) / RANGE_LON) * (W - 2 * PAD)
  const y = PAD + ((MAX_LAT - lat) / RANGE_LAT) * (H - 2 * PAD)
  return [x, y]
}

export function RouteMap({ points }: { points: Pt[] }) {
  const routePts = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
  const routeXY = routePts.map((p) => project(p.lat, p.lon))
  const linePath = routeXY.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Kaart van de route door Europa">
      <rect x="0" y="0" width={W} height={H} rx="16" fill="#f2f8f5" />

      {/* faint network backdrop */}
      <g stroke="#d6e6de" strokeWidth="1" fill="none" opacity="0.9">
        {EDGES.map((e, i) => {
          const a = STATION_MAP[e.from], b = STATION_MAP[e.to]
          if (!a || !b) return null
          const [x1, y1] = project(a.lat, a.lon)
          const [x2, y2] = project(b.lat, b.lon)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        })}
      </g>
      <g fill="#c2d8ce">
        {STATIONS.map((s) => {
          const [x, y] = project(s.lat, s.lon)
          return <circle key={s.id} cx={x} cy={y} r="1.7" />
        })}
      </g>

      {/* route */}
      {routeXY.length > 1 && (
        <>
          <path d={linePath} fill="none" stroke="#7cc0a9" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
          <path d={linePath} fill="none" stroke="#1f6b54" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.1 8" opacity="0.35" />
          <path d={linePath} fill="none" stroke="#1f6b54" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {routeXY.map(([x, y], i) => {
        const isEnd = i === 0 || i === routeXY.length - 1
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={isEnd ? 6 : 4} fill="#fff" stroke="#1f6b54" strokeWidth={isEnd ? 3 : 2} />
            {isEnd && (
              <text
                x={x} y={y - 11}
                textAnchor={x > W / 2 ? 'end' : 'start'}
                dx={x > W / 2 ? 8 : -8}
                fontSize="14" fontWeight="800" fill="#153a30"
                stroke="#f2f8f5" strokeWidth="3.5" paintOrder="stroke"
                style={{ paintOrder: 'stroke' }}
              >
                {routePts[i].city ?? routePts[i].name}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
