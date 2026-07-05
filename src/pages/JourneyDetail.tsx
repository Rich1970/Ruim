import React, { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useApp, genRef, type SavedTrip } from '../state/store'
import { fmtTime, fmtDuration } from '../engine/planner'
import { useSearch } from '../engine/search'
import { paramsToQuery, queryToParams, fmtDateNL, shortName } from '../engine/searchParams'
import { classifyTransfer, type TransferLevel } from '../engine/transfers'
import { AccessRow } from '../components/AccessInfo'
import type { Journey, Leg, FareClass } from '../engine/types'
import { STATION_MAP } from '../engine/data'
import { OperatorBadge, Tag } from '../components/bits'
import { CollapsibleMap } from '../components/CollapsibleMap'
import { TicketingInfo } from '../components/TicketingInfo'
import { CheckoutModal } from '../components/CheckoutModal'
import { IconClock, IconLeaf, IconCheck, IconAlert, IconArrowRight, IconChevron, IconTicket, IconShare, IconMap, IconLock, IconBell } from '../components/icons'

const FARE_KEYS: { cls: FareClass; key: string }[] = [
  { cls: 'saver', key: 'fare_saver' },
  { cls: 'standard', key: 'fare_standard' },
  { cls: 'flex', key: 'fare_flex' },
]

export function JourneyDetail() {
  const { t, lang, user, addTrip } = useApp()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const q = paramsToQuery(params)
  const jid = params.get('j') || ''
  const { loading, outcome } = useSearch(q)
  const [fareCls, setFareCls] = useState<FareClass>('saver')
  const [copied, setCopied] = useState(false)
  const [checkout, setCheckout] = useState(false)
  const journey = outcome?.journeys.find((x) => x.id === jid) ?? outcome?.journeys[0]

  const share = async () => {
    const url = window.location.href
    try { await navigator.clipboard.writeText(url) }
    catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0'
        document.body.appendChild(ta); ta.focus(); ta.select()
        document.execCommand('copy'); document.body.removeChild(ta)
      } catch { /* copy unavailable — link is still in the address bar */ }
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!q) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ink-soft">Ongeldige zoekopdracht. <Link className="text-brand-600 underline" to="/">Nieuwe zoekopdracht</Link></div>
  }
  if (loading || !outcome) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ink-soft">{t('searching')}</div>
  }
  if (!journey) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ink-soft">Reis niet gevonden. <Link className="text-brand-600 underline" to="/">Nieuwe zoekopdracht</Link></div>
  }

  const fare = journey.fares[fareCls]
  const total = fare.price * q.passengers
  // Tickets not on sale yet? bookableFrom is only set when the sale opens in the future.
  const notYetBookable = !!journey.bookableFrom

  const save = () => {
    if (!user) { nav(`/login?next=${encodeURIComponent(location.pathname + location.search)}`); return }
    const trip: SavedTrip = {
      ref: genRef(),
      createdAt: Date.now(),
      status: 'planned',
      fromId: q.from.id, toId: q.to.id,
      fromName: shortName(q.from.name), toName: shortName(q.to.name),
      date: q.date, passengers: q.passengers, card: q.card,
      fareClass: fareCls, priceTotal: total, journey,
      // Store the account contact so a locked-in trip can be emailed when its
      // booking window opens (the whole point of the sale-open alert).
      passengerName: user.name, email: user.email,
      queryStr: queryToParams(q).toString(),
      notifications: [{
        id: 'n' + Date.now(), at: Date.now(), kind: notYetBookable ? 'warning' : 'success',
        title: notYetBookable ? t('await_sale') : 'Reis vastgelegd',
        body: notYetBookable
          ? t('lock_in_saved', { date: fmtDateNL(journey.bookableFrom!, lang) })
          : 'We houden het boekingsvenster en wijzigingen voor je in de gaten.',
      }],
    }
    addTrip(trip)
    nav('/trips?new=' + trip.ref)
  }

  const startCheckout = () => {
    if (!user) { nav(`/login?next=${encodeURIComponent(location.pathname + location.search)}`); return }
    setCheckout(true)
  }

  const onBooked = (trip: SavedTrip) => {
    addTrip(trip)
    setCheckout(false)
    nav('/trips?new=' + trip.ref)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 pb-32 sm:py-7 sm:pb-8">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => nav(-1)} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
          <IconChevron width={16} height={16} className="rotate-180" /> Terug naar opties
        </button>
        <button onClick={share} className="btn-ghost !py-1.5 !px-3 text-sm">
          {copied ? <IconCheck width={16} height={16} className="text-emerald-600" /> : <IconShare width={16} height={16} />}
          {copied ? t('share_copied') : t('share')}
        </button>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5">{journey.tags.map((tg) => <Tag key={tg} tag={tg} />)}</div>
        <div className="mt-3 flex items-center gap-3">
          <div className="text-3xl font-extrabold tabular-nums text-ink">{fmtTime(journey.depMin)}</div>
          <IconArrowRight className="text-ink-faint" />
          <div className="text-3xl font-extrabold tabular-nums text-ink">{fmtTime(journey.arrMin)}{journey.arrDayOffset > 0 && <span className="ml-1 align-top text-sm font-bold text-brand-600">+{journey.arrDayOffset}</span>}</div>
          <div className="ml-auto text-right text-sm text-ink-soft">
            <div className="inline-flex items-center gap-1.5 font-bold text-ink"><IconClock width={16} height={16} className="text-ink-faint" />{fmtDuration(journey.durationMin)}</div>
            <div>{journey.changes === 0 ? t('direct') : `${journey.changes} ${journey.changes === 1 ? t('change_one') : t('changes')}`} · {journey.km} km</div>
          </div>
        </div>
        <div className="mt-1 text-sm text-ink-faint">{shortName(outcome.from.name)} → {shortName(outcome.to.name)} · {fmtDateNL(q.date, lang)}</div>
      </div>

      {/* Route map (collapsed by default) */}
      <div className="mt-4">
        <CollapsibleMap
          points={[journey.legs[0].from, ...journey.legs.map((l) => l.to)]}
          accessFrom={journey.access ? { lat: q.from.lat, lon: q.from.lon, name: shortName(q.from.name) } : undefined}
          egressTo={journey.egress ? { lat: q.to.lat, lon: q.to.lon, name: shortName(q.to.name) } : undefined}
        />
      </div>

      {/* CO2 */}
      <div className="card mt-4 flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><IconLeaf /></span>
        <div className="text-sm">
          <div className="font-bold text-ink">{journey.co2Kg} kg CO₂ · {t('co2_label')}</div>
          <div className="text-ink-faint">{t('co2_vs', { car: journey.co2CarKg, plane: journey.co2PlaneKg })}</div>
        </div>
        <div className="ml-auto hidden text-right sm:block">
          <div className="text-xs font-semibold text-emerald-700">−{Math.round((1 - journey.co2Kg / journey.co2PlaneKg) * 100)}%</div>
          <div className="text-[11px] text-ink-faint">vs. vliegtuig</div>
        </div>
      </div>

      {/* Timeline */}
      <h2 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wide text-ink-faint">{t('detail_title')}</h2>
      <div className="card overflow-hidden">
        {journey.access && <AccessRow a={journey.access} kind="access" />}
        {journey.legs.map((leg, i) => (
          <React.Fragment key={i}>
            <LegRow leg={leg} />
            {i < journey.legs.length - 1 && <TransferRow leg={leg} next={journey.legs[i + 1]} />}
          </React.Fragment>
        ))}
        {journey.egress && <AccessRow a={journey.egress} kind="egress" />}
      </div>

      <div className="mt-4"><TicketingInfo journey={journey} /></div>

      {/* Booking window notice — tickets not yet on sale */}
      {notYetBookable && (
        <div className="card mt-4 flex items-start gap-3 border-amber-200 bg-amber-50 p-4">
          <span className="text-amber-600"><IconAlert /></span>
          <div className="text-sm">
            <div className="font-bold text-amber-900">{t('lock_in_title')} · {t('bookable_from')} {fmtDateNL(journey.bookableFrom!, lang)}</div>
            <div className="text-amber-800">{t('lock_in_body', { date: fmtDateNL(journey.bookableFrom!, lang) })}</div>
          </div>
        </div>
      )}

      {/* Fare selection */}
      <h2 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wide text-ink-faint">{t('choose_fare')}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {FARE_KEYS.map(({ cls, key }) => {
          const f = journey.fares[cls]
          const selected = fareCls === cls
          return (
            <button
              key={cls}
              onClick={() => setFareCls(cls)}
              className={`card p-4 text-left transition ${selected ? 'ring-2 ring-brand-500 border-brand-300' : 'hover:border-brand-200'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">{t(key as any)}</span>
                <span className={`grid h-5 w-5 place-items-center rounded-full border ${selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-brand-200'}`}>
                  {selected && <IconCheck width={13} height={13} />}
                </span>
              </div>
              <div className="mt-1 text-2xl font-extrabold text-brand-700">€{f.price * q.passengers}</div>
              <ul className="mt-2 space-y-1 text-xs text-ink-soft">
                <FareLine ok>{t('seat_included')}</FareLine>
                <FareLine ok={f.changeable}>{t('changeable')}</FareLine>
                <FareLine ok={f.refundable}>{f.refundable ? t('refundable') : t('non_refundable')}</FareLine>
              </ul>
            </button>
          )
        })}
      </div>

      {/* Desktop action */}
      <div className="mt-6 hidden items-center gap-3 sm:flex">
        <div className="text-sm text-ink-soft">
          <span className="text-2xl font-extrabold text-ink">€{total}</span>
          <span className="ml-2">{notYetBookable ? t('expected_price') : t('price_for', { n: q.passengers })}</span>
        </div>
        <div className="ml-auto flex gap-2">
          {!user ? (
            <Link to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} className="btn-primary !py-3">{t('login_to_book')}</Link>
          ) : notYetBookable ? (
            <button onClick={save} className="btn-primary !py-3"><IconBell width={18} height={18} />{t('lock_in_cta')}</button>
          ) : (
            <>
              <button onClick={save} className="btn-ghost !py-3">{t('book_now')}</button>
              <button onClick={startCheckout} className="btn-primary !py-3"><IconLock width={18} height={18} />{t('reserve_and_pay')}</button>
            </>
          )}
        </div>
      </div>

      {/* Mobile sticky action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 p-3 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="leading-tight">
            <div className="text-xl font-extrabold text-ink">€{total}</div>
            <div className="text-[11px] text-ink-faint">{notYetBookable ? t('expected_price') : t('price_for', { n: q.passengers })}</div>
          </div>
          {!user ? (
            <Link to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} className="btn-primary ml-auto !py-3">{t('login_to_book')}</Link>
          ) : notYetBookable ? (
            <button onClick={save} className="btn-primary ml-auto !py-3"><IconBell width={18} height={18} />{t('lock_in_cta')}</button>
          ) : (
            <button onClick={startCheckout} className="btn-primary ml-auto !py-3"><IconLock width={18} height={18} />{t('reserve_and_pay')}</button>
          )}
        </div>
      </div>

      {checkout && journey && (
        <CheckoutModal journey={journey} query={q} fareClass={fareCls} onClose={() => setCheckout(false)} onBooked={onBooked} />
      )}
    </div>
  )
}

function LegRow({ leg }: { leg: Leg }) {
  const { t } = useApp()
  const resKey = leg.reservation === 'required' ? 'leg_reservation_required' : leg.reservation === 'recommended' ? 'leg_reservation_recommended' : 'leg_reservation_optional'
  const resColor = leg.reservation === 'required' ? 'text-rose-600 bg-rose-50' : leg.reservation === 'recommended' ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'
  return (
    <div className="flex gap-3 p-4">
      <div className="flex flex-col items-center pt-1">
        <span className="h-2.5 w-2.5 rounded-full border-2 border-brand-500" />
        <span className="my-1 w-0.5 flex-1 bg-brand-100" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="w-12 text-lg font-extrabold tabular-nums text-ink">{fmtTime(leg.depMin)}</span>
          <span className="font-semibold text-ink">{leg.from.name}</span>
          <span className="ml-auto text-xs text-ink-faint">perron {platformOf(leg, 'dep')}</span>
        </div>
        <div className="my-2 flex flex-wrap items-center gap-2 pl-14 text-sm">
          <OperatorBadge op={leg.operator} small />
          <span className="font-semibold text-ink-soft">{leg.trainName}</span>
          <span className="text-ink-faint">· {fmtDuration(leg.durationMin)}</span>
          <span className={`chip ${resColor}`}>{t(resKey as any)}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="w-12 text-lg font-extrabold tabular-nums text-ink">{fmtTime(leg.arrMin)}{leg.arrDayOffset > leg.depDayOffset && <span className="align-top text-[10px] text-brand-600">+{leg.arrDayOffset - leg.depDayOffset}</span>}</span>
          <span className="font-semibold text-ink">{leg.to.name}</span>
          <span className="ml-auto text-xs text-ink-faint">perron {platformOf(leg, 'arr')}</span>
        </div>
      </div>
    </div>
  )
}

const TRANSFER_STYLE: Record<TransferLevel, string> = {
  tight: 'border-rose-200 bg-rose-50 text-rose-700',
  fair: 'border-amber-200 bg-amber-50 text-amber-800',
  roomy: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

function TransferRow({ leg, next }: { leg: Leg; next: Leg }) {
  const { t } = useApp()
  const info = classifyTransfer(leg, next)
  const label = info.level === 'tight' ? t('transfer_tight') : info.level === 'fair' ? t('transfer_fair') : t('transfer_roomy')
  return (
    <div className={`border-y border-dashed px-4 py-2.5 ${TRANSFER_STYLE[info.level]}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-bold">
        {info.level === 'tight' ? <IconAlert width={14} height={14} /> : <IconClock width={14} height={14} />}
        {label} · {t('transfer_at')} {leg.to.city} · {fmtDuration(info.minutes)}
        {info.crossOperator && <span className="font-normal opacity-80">· {t('transfer_cross')}</span>}
        {next.category === 'ferry' && <span className="font-normal opacity-80">· inchecken veerboot</span>}
        {next.operator.id === 'eurostar' && <span className="font-normal opacity-80">· check-in & paspoort</span>}
      </div>
      {info.level === 'tight' && <div className="mt-1 text-[11px] font-normal leading-snug">{t('transfer_tight_hint')}</div>}
    </div>
  )
}

function FareLine({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? 'text-ink-soft' : 'text-ink-faint line-through'}`}>
      <span className={ok ? 'text-emerald-600' : 'text-ink-faint'}>{ok ? <IconCheck width={13} height={13} /> : '—'}</span>
      {children}
    </li>
  )
}

function platformOf(leg: Leg, which: 'dep' | 'arr'): number {
  let h = 0
  const s = leg.trainName + which + (which === 'dep' ? leg.from.id : leg.to.id)
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return 1 + (h % 16)
}

function primaryOperatorSite(j: Journey): string {
  let best = j.legs[0]
  for (const l of j.legs) if (l.km > best.km) best = l
  return best.operator.site
}
