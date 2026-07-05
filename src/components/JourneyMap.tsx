import React, { useEffect, useMemo, useRef, useState } from 'react'
import { STATIONS, EDGES, STATION_MAP } from '../engine/data'
import { EUROPE_LAND } from '../engine/geo'

export interface Pt { lat: number; lon: number; city?: string; name?: string }
export interface Extra { lat: number; lon: number; name: string }

// --- projection into a fixed base canvas ------------------------------------
const LATS = STATIONS.map((s) => s.lat)
const LONS = STATIONS.map((s) => s.lon)
const MIN_LAT = Math.min(...LATS) - 1.5, MAX_LAT = Math.max(...LATS) + 1.5
const MIN_LON = Math.min(...LONS) - 2, MAX_LON = Math.max(...LONS) + 2
const KX = Math.cos(((MIN_LAT + MAX_LAT) / 2) * Math.PI / 180)
const BASE_W = 2000
const BASE_H = Math.round(BASE_W * ((MAX_LAT - MIN_LAT) / ((MAX_LON - MIN_LON) * KX)))

function project(lat: number, lon: number): [number, number] {
  const x = (((lon - MIN_LON) * KX) / ((MAX_LON - MIN_LON) * KX)) * BASE_W
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * BASE_H
  return [x, y]
}

// Pre-projected static layers (computed once).
const LAND_PATHS: string[] = EUROPE_LAND.map((ring) =>
  ring.map((p, i) => { const [x, y] = project(p[1], p[0]); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}` }).join(' ') + ' Z',
)
const NET_LINES = EDGES.map((e) => {
  const a = STATION_MAP[e.from], b = STATION_MAP[e.to]
  const [x1, y1] = project(a.lat, a.lon), [x2, y2] = project(b.lat, b.lon)
  return { x1, y1, x2, y2 }
})

interface VB { x: number; y: number; w: number; h: number }

export function JourneyMap({ points, egressTo, accessFrom }: { points: Pt[]; egressTo?: Extra; accessFrom?: Extra }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [vb, setVb] = useState<VB>({ x: 0, y: 0, w: BASE_W, h: BASE_H })
  const drag = useRef<{ x: number; y: number; vb: VB } | null>(null)

  const routeXY = useMemo(() => points.filter(p => Number.isFinite(p.lat)).map(p => project(p.lat, p.lon)), [points])
  const egressXY = egressTo ? project(egressTo.lat, egressTo.lon) : null
  const accessXY = accessFrom ? project(accessFrom.lat, accessFrom.lon) : null

  // Fit viewBox to the route (plus any car endpoints), matching container aspect.
  function fit(): VB {
    const pts = [...routeXY]
    if (egressXY) pts.push(egressXY)
    if (accessXY) pts.push(accessXY)
    if (pts.length === 0) return { x: 0, y: 0, w: BASE_W, h: BASE_H }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const [x, y] of pts) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y) }
    const padX = Math.max((maxX - minX) * 0.18, 120)
    const padY = Math.max((maxY - minY) * 0.18, 120)
    minX -= padX; maxX += padX; minY -= padY; maxY += padY
    let w = maxX - minX, h = maxY - minY
    const rect = wrapRef.current?.getBoundingClientRect()
    const aspect = rect && rect.height ? rect.width / rect.height : 1.6
    if (w / h < aspect) { const nw = h * aspect; minX -= (nw - w) / 2; w = nw }
    else { const nh = w / aspect; minY -= (nh - h) / 2; h = nh }
    return { x: minX, y: minY, w, h }
  }

  useEffect(() => { setVb(fit()) /* eslint-disable-next-line */ }, [points, egressTo, accessFrom])

  // Non-passive wheel zoom.
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      setVb((cur) => {
        const factor = e.deltaY > 0 ? 1.12 : 0.89
        const nw = Math.min(Math.max(cur.w * factor, 60), BASE_W * 1.6)
        const nh = cur.h * (nw / cur.w)
        const px = cur.x + ((e.clientX - rect.left) / rect.width) * cur.w
        const py = cur.y + ((e.clientY - rect.top) / rect.height) * cur.h
        return { x: px - ((e.clientX - rect.left) / rect.width) * nw, y: py - ((e.clientY - rect.top) / rect.height) * nh, w: nw, h: nh }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  function onDown(e: React.PointerEvent) { drag.current = { x: e.clientX, y: e.clientY, vb }; (e.target as Element).setPointerCapture?.(e.pointerId) }
  function onMove(e: React.PointerEvent) {
    if (!drag.current) return
    const rect = svgRef.current!.getBoundingClientRect()
    const dx = (e.clientX - drag.current.x) * (drag.current.vb.w / rect.width)
    const dy = (e.clientY - drag.current.y) * (drag.current.vb.h / rect.height)
    setVb({ ...drag.current.vb, x: drag.current.vb.x - dx, y: drag.current.vb.y - dy })
  }
  function onUp() { drag.current = null }
  function zoomBy(factor: number) {
    setVb((c) => { const nw = Math.min(Math.max(c.w * factor, 60), BASE_W * 1.6); const nh = c.h * (nw / c.w); return { x: c.x + (c.w - nw) / 2, y: c.y + (c.h - nh) / 2, w: nw, h: nh } })
  }

  const k = vb.w / 1000 // keeps marker/label size ~constant on screen
  const labelPts = routeXY.length <= 9 ? routeXY : [routeXY[0], routeXY[routeXY.length - 1]]

  const backdrop = useMemo(() => (
    <>
      <g fill="#eef2e6" stroke="#c4d1c6" strokeWidth={0.9 * k} strokeLinejoin="round">
        {LAND_PATHS.map((d, i) => <path key={i} d={d} />)}
      </g>
      <g stroke="#b9cfc9" strokeWidth={1.4 * k} fill="none" strokeLinecap="round">
        {NET_LINES.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
      </g>
    </>
  ), [k])

  return (
    <div ref={wrapRef} className="relative h-[300px] w-full overflow-hidden rounded-xl sm:h-[380px]">
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        role="img" aria-label="Kaart van de treinroute"
      >
        <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="#cfe0ea" />
        {backdrop}
        {/* route with white casing */}
        {routeXY.length > 1 && <>
          <polyline points={routeXY.map(p => p.join(',')).join(' ')} fill="none" stroke="#fff" strokeWidth={9 * k} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={routeXY.map(p => p.join(',')).join(' ')} fill="none" stroke="#1f6b54" strokeWidth={4.5 * k} strokeLinecap="round" strokeLinejoin="round" />
        </>}
        {/* car access / egress (dashed) */}
        {accessXY && routeXY[0] && <DashLeg from={accessXY} to={routeXY[0]} k={k} />}
        {egressXY && routeXY.length > 0 && <DashLeg from={routeXY[routeXY.length - 1]} to={egressXY} k={k} />}
        {/* transfer points (overstappen) */}
        {routeXY.slice(1, -1).map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={6 * k} fill="#fff" stroke="#1f6b54" strokeWidth={2.6 * k} />
            <circle cx={x} cy={y} r={2 * k} fill="#1f6b54" />
          </g>
        ))}
        {/* endpoint pins */}
        {routeXY[0] && <Pin x={routeXY[0][0]} y={routeXY[0][1]} k={k} color="#1f6b54" />}
        {routeXY.length > 1 && !egressXY && <Pin x={routeXY[routeXY.length - 1][0]} y={routeXY[routeXY.length - 1][1]} k={k} color="#c1272d" />}
        {egressXY && <Pin x={egressXY[0]} y={egressXY[1]} k={k} color="#c1272d" car />}
        {/* labels */}
        {labelPts.map(([x, y], i) => {
          const p = routeXY.length <= 9 ? points[i] : (i === 0 ? points[0] : points[points.length - 1])
          const name = p?.city || p?.name || ''
          return <MapLabel key={i} x={x} y={y - 34 * k} k={k} text={name} anchor={x > vb.x + vb.w / 2 ? 'end' : 'start'} />
        })}
        {egressTo && egressXY && <MapLabel x={egressXY[0]} y={egressXY[1] - 34 * k} k={k} text={egressTo.name} anchor={egressXY[0] > vb.x + vb.w / 2 ? 'end' : 'start'} />}
      </svg>

      {/* zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-md">
        <button onClick={() => zoomBy(0.7)} className="grid h-9 w-9 place-items-center text-xl font-bold text-ink hover:bg-brand-50" aria-label="Inzoomen">+</button>
        <button onClick={() => zoomBy(1.4)} className="grid h-9 w-9 place-items-center border-t border-black/10 text-xl font-bold text-ink hover:bg-brand-50" aria-label="Uitzoomen">−</button>
      </div>
      <button onClick={() => setVb(fit())} className="absolute bottom-3 left-3 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink shadow-md hover:bg-brand-50">Route passend</button>
    </div>
  )
}

function DashLeg({ from, to, k }: { from: [number, number]; to: [number, number]; k: number }) {
  return <>
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="#fff" strokeWidth={7 * k} strokeLinecap="round" />
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="#b5751b" strokeWidth={3.5 * k} strokeLinecap="round" strokeDasharray={`${2 * k} ${7 * k}`} />
  </>
}

function Pin({ x, y, k, color, car }: { x: number; y: number; k: number; color: string; car?: boolean }) {
  const s = k
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C-9 -14 -13 -20 0 -30 C13 -20 9 -14 0 0 Z" fill={color} stroke="#fff" strokeWidth={2} />
      <circle cx={0} cy={-20} r={5.5} fill="#fff" />
      {car && <text x={0} y={-16.5} textAnchor="middle" fontSize="9">🚗</text>}
    </g>
  )
}

export default JourneyMap

function MapLabel({ x, y, k, text, anchor }: { x: number; y: number; k: number; text: string; anchor: 'start' | 'end' }) {
  if (!text) return null
  return (
    <text x={x} y={y} textAnchor={anchor} dx={anchor === 'end' ? 10 * k : -10 * k}
      fontSize={15 * k} fontWeight={800} fill="#123" stroke="#e8eef2" strokeWidth={4 * k}
      style={{ paintOrder: 'stroke' }}>{text}</text>
  )
}

