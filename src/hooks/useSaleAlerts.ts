// Time-triggered "the sale window just opened" alerts.
//
// A locked-in trip carries journey.bookableFrom = the date tickets go on sale.
// This watcher scans the signed-in user's saved trips (on mount + on an
// interval) and, the moment a trip's window has opened, fires exactly one alert:
//   • an in-app notification (via the store's atomic markSaleOpen), and
//   • a transactional email (real via Resend if configured, else simulated).
// The saleAlerted flag makes it idempotent, so it never double-fires.
//
// useSaleTrigger() exposes the same routine for a manual "simulate sale
// opening" test action, so the flow is demoable without waiting real days.

import { useEffect, useRef, useCallback } from 'react'
import { useApp, type SavedTrip, type TripNotification } from '../state/store'
import { todayIso, addDaysIso } from '../engine/searchParams'
import { sendTripEmail } from '../engine/email'
import { translate } from '../i18n/strings'
import type { Lang } from '../i18n/strings'

let seq = 0
function saleNotification(trip: SavedTrip, lang: Lang): TripNotification {
  return {
    id: 'sale-' + trip.ref + '-' + (seq++),
    at: Date.now(),
    kind: 'success',
    title: translate(lang, 'sale_open_title'),
    body: translate(lang, 'sale_open_body', { from: trip.fromName, to: trip.toName }),
  }
}

/** A trip whose tickets are on sale now, still only planned, not yet alerted. */
function windowJustOpened(trip: SavedTrip, today: string): boolean {
  const bf = trip.journey.bookableFrom
  return trip.status === 'planned' && !trip.paid && !trip.saleAlerted && !!bf && bf <= today
}

/** Background watcher — mount once (in App). */
/** Ensure the trip carries a recipient — fall back to the account contact. */
function withContact(trip: SavedTrip, user: { name: string; email: string } | null): SavedTrip {
  if (trip.email && trip.email.trim()) return trip
  return { ...trip, email: user?.email, passengerName: trip.passengerName || user?.name }
}

export function useSaleWatcher(): void {
  const { trips, user, lang, markSaleOpen } = useApp()
  const tripsRef = useRef(trips)
  tripsRef.current = trips
  // Dedupe within this session (also guards against StrictMode's double effect
  // run before the saleAlerted flag has round-tripped through state).
  const firedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return
    const check = () => {
      const today = todayIso()
      for (const trip of tripsRef.current) {
        if (!windowJustOpened(trip, today) || firedRef.current.has(trip.ref)) continue
        firedRef.current.add(trip.ref)
        markSaleOpen(trip.ref, saleNotification(trip, lang))
        void sendTripEmail('sale_open', withContact(trip, user), lang)
      }
    }
    check()
    const iv = setInterval(check, 60_000)
    return () => clearInterval(iv)
  }, [user, lang, markSaleOpen])
}

/** Manual trigger for the "simulate sale opening" test button in My trips. */
export function useSaleTrigger(): (trip: SavedTrip) => void {
  const { lang, user, markSaleOpen } = useApp()
  return useCallback((trip: SavedTrip) => {
    // Pull bookableFrom into the past so the trip reads as bookable everywhere,
    // then fire the same alert + email the real watcher would.
    const journey = { ...trip.journey, bookableFrom: addDaysIso(todayIso(), -1) }
    markSaleOpen(trip.ref, saleNotification(trip, lang), { journey })
    void sendTripEmail('sale_open', withContact({ ...trip, journey }, user), lang)
  }, [lang, user, markSaleOpen])
}
