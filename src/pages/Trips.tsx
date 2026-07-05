import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp, type SavedTrip, type TripNotification } from '../state/store'
import { fmtTime, fmtDuration } from '../engine/planner'
import { fmtDateNL, todayIso } from '../engine/searchParams'
import { OperatorBadge } from '../components/bits'
import { CollapsibleMap } from '../components/CollapsibleMap'
import { Ticket, SupportNotice } from '../components/Ticket'
import { EmailPreviewModal } from '../components/EmailPreviewModal'
import { useSaleTrigger } from '../hooks/useSaleAlerts'
import { euro } from '../engine/payment'
import { IconArrowRight, IconClock, IconBell, IconTicket, IconCheck, IconAlert } from '../components/icons'

export function Trips() {
  const { t, user, trips } = useApp()
  const [params] = useSearchParams()
  const highlight = params.get('new')

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><IconTicket /></span>
        <h1 className="mt-4 text-xl font-extrabold text-ink">{t('trips_title')}</h1>
        <p className="mt-2 text-ink-soft">{t('login_to_book')}</p>
        <Link to="/login?next=/trips" className="btn-primary mt-4">{t('nav_login')}</Link>
      </div>
    )
  }

  const today = todayIso()
  const upcoming = trips.filter((tr) => tr.date >= today)
  const past = trips.filter((tr) => tr.date < today)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">{t('trips_title')}</h1>

      {trips.length === 0 ? (
        <div className="card mt-5 p-8 text-center text-ink-soft">
          {t('trips_empty')}
          <div className="mt-4"><Link to="/" className="btn-primary">{t('hero_cta')}</Link></div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && <Section title={t('trips_upcoming')}>{upcoming.map((tr) => <TripCard key={tr.ref} trip={tr} highlight={tr.ref === highlight} />)}</Section>}
          {past.length > 0 && <Section title={t('trips_past')}>{past.map((tr) => <TripCard key={tr.ref} trip={tr} highlight={false} />)}</Section>}
        </>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-faint">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function TripCard({ trip, highlight }: { trip: SavedTrip; highlight: boolean }) {
  const { t, lang, updateTrip, removeTrip, addNotification } = useApp()
  const triggerSaleOpen = useSaleTrigger()
  const nav = useNavigate()
  const [open, setOpen] = useState(highlight)
  const [emailOpen, setEmailOpen] = useState(false)
  const j = trip.journey
  const notYetBookable = !!j.bookableFrom && j.bookableFrom > todayIso()
  const bookNow = () => { if (trip.queryStr) nav(`/journey?${trip.queryStr}&j=${encodeURIComponent(j.id)}`) }
  const simulateSale = () => { triggerSaleOpen(trip); if (!open) setOpen(true) }

  function recalc() {
    const n = makeRecalcNotification(trip)
    addNotification(trip.ref, n)
    if (!open) setOpen(true)
  }

  return (
    <div className={`card overflow-hidden ${highlight ? 'ring-2 ring-brand-400' : ''}`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className={`chip ${trip.status === 'booked' ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-50 text-brand-700'}`}>
            {trip.status === 'booked' ? <IconCheck width={13} height={13} /> : <IconClock width={13} height={13} />}
            {trip.status === 'booked' ? t('status_booked') : t('status_planned')}
          </span>
          {notYetBookable && <span className="chip bg-amber-100 text-amber-800">{t('not_bookable_short')} · {fmtDateNL(j.bookableFrom!, lang)}</span>}
          <span className="ml-auto text-xs font-semibold text-ink-faint">{t('ref')} {trip.ref}</span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-lg font-extrabold text-ink">
          <span className="truncate">{trip.fromName}</span>
          <IconArrowRight width={17} height={17} className="shrink-0 text-ink-faint" />
          <span className="truncate">{trip.toName}</span>
        </div>
        <div className="mt-0.5 text-sm text-ink-faint">
          {fmtDateNL(trip.date, lang)} · {fmtTime(j.depMin)}–{fmtTime(j.arrMin)} · {fmtDuration(j.durationMin)} · {trip.passengers}× · {trip.paid && trip.grandTotal != null ? euro(trip.grandTotal) : `€${trip.priceTotal}`}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {dedupeOps(trip).map((op) => <OperatorBadge key={op.id} op={op} small />)}
          <div className="ml-auto flex flex-wrap gap-2">
            {trip.status === 'planned' && (notYetBookable
              ? <>
                  <span className="chip bg-amber-50 text-amber-700"><IconClock width={12} height={12} /> {t('await_sale')}</span>
                  <button onClick={simulateSale} className="btn-subtle !py-2" title={t('sale_sim_hint')}><IconBell width={13} height={13} /> {t('sale_sim')}</button>
                </>
              : trip.queryStr && <button onClick={bookNow} className="btn-primary !py-2"><IconTicket width={15} height={15} /> {t('book_when_open')}</button>)}
            <button onClick={recalc} className="btn-subtle !py-2" title={t('recalc_hint')}>{t('recalc')}</button>
            <button onClick={() => setOpen((v) => !v)} className="btn-ghost !py-2">{open ? '▲' : '▼'} {t('view')}</button>
          </div>
        </div>
        {trip.notifications.length > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700">
            <IconBell width={14} height={14} /> {trip.notifications.length} {t('notifications').toLowerCase()}
          </div>
        )}
      </div>

      {open && (
        <div className="border-t border-black/5 bg-brand-50/30 p-4 sm:p-5">
          {trip.paid && <div className="mb-4"><Ticket trip={trip} /></div>}
          {trip.paid && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
              <IconCheck width={16} height={16} className="text-emerald-600" />
              <span className="text-emerald-800">{t('email_confirm_sent', { email: trip.email || '—' })}</span>
              <button onClick={() => setEmailOpen(true)} className="ml-auto font-semibold text-emerald-700 underline">{t('email_view')}</button>
            </div>
          )}
          <div className="mb-4"><CollapsibleMap points={[j.legs[0].from, ...j.legs.map((l) => l.to)]} /></div>
          {/* legs */}
          <div className="space-y-2">
            {j.legs.map((leg, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 font-bold tabular-nums text-ink">{fmtTime(leg.depMin)}–{fmtTime(leg.arrMin)}</span>
                <OperatorBadge op={leg.operator} small />
                <span className="truncate text-ink-soft">{leg.from.city} → {leg.to.city}</span>
                <span className="ml-auto hidden shrink-0 text-xs text-ink-faint sm:block">{leg.trainName}</span>
              </div>
            ))}
          </div>

          {/* notifications */}
          <h3 className="mt-4 mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-faint">
            <IconBell width={14} height={14} /> {t('notifications')}
          </h3>
          {trip.notifications.length === 0 ? (
            <p className="text-sm text-ink-faint">{t('no_notifications')}</p>
          ) : (
            <div className="space-y-2">
              {trip.notifications.map((n) => <NotificationRow key={n.id} n={n} lang={lang} />)}
            </div>
          )}

          {(trip.paid || trip.status === 'booked') && <div className="mt-4"><SupportNotice trip={trip} /></div>}

          <div className="mt-4 flex flex-wrap gap-2">
            {trip.status === 'planned' && !notYetBookable && trip.queryStr && (
              <button onClick={bookNow} className="btn-primary !py-2"><IconTicket width={16} height={16} /> {t('book_when_open')}</button>
            )}
            <a href={primaryOperatorSite(trip)} target="_blank" rel="noopener" className="btn-ghost !py-2"><IconTicket width={16} height={16} /> {t('open_operator')}</a>
            <button onClick={() => removeTrip(trip.ref)} className="btn-ghost !py-2 !text-rose-600">{t('remove')}</button>
          </div>
        </div>
      )}
      {emailOpen && <EmailPreviewModal trip={trip} onClose={() => setEmailOpen(false)} />}
    </div>
  )
}

function NotificationRow({ n, lang }: { n: TripNotification; lang: 'nl' | 'en' }) {
  const color = n.kind === 'warning' ? 'bg-amber-50 text-amber-800' : n.kind === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-white text-ink-soft'
  const icon = n.kind === 'warning' ? <IconAlert width={15} height={15} /> : n.kind === 'success' ? <IconCheck width={15} height={15} /> : <IconBell width={15} height={15} />
  const time = new Date(n.at).toLocaleString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return (
    <div className={`flex items-start gap-2 rounded-lg border border-black/5 px-3 py-2 text-sm ${color}`}>
      <span className="mt-0.5">{icon}</span>
      <div>
        <div className="font-semibold">{n.title}</div>
        <div className="text-xs opacity-90">{n.body}</div>
        <div className="mt-0.5 text-[10px] uppercase tracking-wide opacity-60">{time}</div>
      </div>
    </div>
  )
}

const RECALC_MESSAGES: { kind: TripNotification['kind']; title: { nl: string; en: string }; body: { nl: string; en: string } }[] = [
  { kind: 'info', title: { nl: 'Geen wijzigingen', en: 'No changes' }, body: { nl: 'Je reis loopt volgens plan. Alle aansluitingen zijn gehaald.', en: 'Your journey is on schedule. All connections check out.' } },
  { kind: 'warning', title: { nl: 'Perronwijziging', en: 'Platform change' }, body: { nl: 'Let op: je eerste trein vertrekt van een ander perron. Check de borden op het station.', en: 'Heads up: your first train departs from a different platform.' } },
  { kind: 'warning', title: { nl: 'Lichte vertraging verwacht', en: 'Minor delay expected' }, body: { nl: 'Je aansluitende trein heeft +8 min vertraging. De overstap is nog ruim genoeg.', en: 'Your connecting train is +8 min late. The transfer window still holds.' } },
  { kind: 'success', title: { nl: 'Goedkoper alternatief gevonden', en: 'Cheaper option found' }, body: { nl: 'Er is nu een spaartarief vrijgekomen dat €22 goedkoper is. Bekijk het bij de vervoerder.', en: 'A saver fare just opened up, €22 cheaper. Check it at the operator.' } },
]

function makeRecalcNotification(trip: SavedTrip): TripNotification {
  const idx = trip.notifications.length % RECALC_MESSAGES.length
  const m = RECALC_MESSAGES[idx]
  return { id: 'n' + Date.now() + idx, at: Date.now(), kind: m.kind, title: m.title.nl, body: m.body.nl }
}

function dedupeOps(trip: SavedTrip) {
  const seen = new Set<string>(); const out = []
  for (const l of trip.journey.legs) if (!seen.has(l.operator.id)) { seen.add(l.operator.id); out.push(l.operator) }
  return out
}

function primaryOperatorSite(trip: SavedTrip): string {
  let best = trip.journey.legs[0]
  for (const l of trip.journey.legs) if (l.km > best.km) best = l
  return best.operator.site
}
