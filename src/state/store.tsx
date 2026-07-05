import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { S, type Lang } from '../i18n/strings'
import type { Journey, FareClass } from '../engine/types'

export interface SavedTrip {
  ref: string
  createdAt: number
  status: 'planned' | 'booked'
  fromId: string
  toId: string
  fromName: string
  toName: string
  date: string
  passengers: number
  card: string
  fareClass: FareClass
  priceTotal: number
  journey: Journey
  notifications: TripNotification[]
  /** Set when booked & paid via the (sandbox) checkout. */
  paid?: boolean
  passengerName?: string
  email?: string
  serviceFee?: number
  grandTotal?: number
  pspRef?: string
  /** Encoded search params, so a locked-in plan can be re-opened to book later. */
  queryStr?: string
  /** Set once we've alerted the traveller that the booking window opened. */
  saleAlerted?: boolean
}

export interface TripNotification {
  id: string
  at: number
  kind: 'info' | 'warning' | 'success'
  title: string
  body: string
}

interface UserRecord {
  name: string
  email: string
  pass: string
  card: string
  trips: SavedTrip[]
}

interface AppState {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: keyof typeof S, vars?: Record<string, string | number>) => string
  user: { name: string; email: string; card: string } | null
  login: (email: string, pass: string) => { ok: boolean; error?: string }
  register: (name: string, email: string, pass: string) => { ok: boolean; error?: string }
  logout: () => void
  setDefaultCard: (card: string) => void
  trips: SavedTrip[]
  addTrip: (t: SavedTrip) => void
  updateTrip: (ref: string, patch: Partial<SavedTrip>) => void
  removeTrip: (ref: string) => void
  addNotification: (ref: string, n: TripNotification) => void
  /** Atomically flag a trip's sale window as opened and prepend its alert. */
  markSaleOpen: (ref: string, n: TripNotification, patch?: Partial<SavedTrip>) => void
}

const Ctx = createContext<AppState | null>(null)

const USERS_KEY = 'spoorwijs_users_v1'
const SESSION_KEY = 'spoorwijs_session_v1'
const LANG_KEY = 'spoorwijs_lang_v1'

function loadUsers(): Record<string, UserRecord> {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}') } catch { return {} }
}
function saveUsers(u: Record<string, UserRecord>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u))
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) as Lang) || 'nl')
  const [users, setUsers] = useState<Record<string, UserRecord>>(() => loadUsers())
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem(SESSION_KEY))

  useEffect(() => { localStorage.setItem(LANG_KEY, lang); document.documentElement.lang = lang }, [lang])

  const persist = useCallback((next: Record<string, UserRecord>) => {
    setUsers(next); saveUsers(next)
  }, [])

  const setLang = useCallback((l: Lang) => setLangState(l), [])

  const t = useCallback(
    (key: keyof typeof S, vars?: Record<string, string | number>) => {
      let str = S[key]?.[lang] ?? String(key)
      if (vars) for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, String(v))
      return str
    },
    [lang],
  )

  const currentUser = email ? users[email] : null

  const login = useCallback((em: string, pass: string) => {
    const u = users[em.trim().toLowerCase()]
    if (!u || u.pass !== pass) return { ok: false, error: 'err_credentials' }
    setEmail(u.email); localStorage.setItem(SESSION_KEY, u.email)
    return { ok: true }
  }, [users])

  const register = useCallback((name: string, em: string, pass: string) => {
    const key = em.trim().toLowerCase()
    if (!name || !em || !pass) return { ok: false, error: 'err_fields' }
    if (users[key]) return { ok: false, error: 'err_exists' }
    const rec: UserRecord = { name, email: key, pass, card: 'none', trips: [] }
    const next = { ...users, [key]: rec }
    persist(next)
    setEmail(key); localStorage.setItem(SESSION_KEY, key)
    return { ok: true }
  }, [users, persist])

  const logout = useCallback(() => { setEmail(null); localStorage.removeItem(SESSION_KEY) }, [])

  const mutateUser = useCallback((fn: (u: UserRecord) => UserRecord) => {
    if (!email) return
    const cur = users[email]
    if (!cur) return
    const next = { ...users, [email]: fn(cur) }
    persist(next)
  }, [email, users, persist])

  const addTrip = useCallback((trip: SavedTrip) => {
    mutateUser((u) => ({ ...u, trips: [trip, ...u.trips] }))
  }, [mutateUser])

  const updateTrip = useCallback((ref: string, patch: Partial<SavedTrip>) => {
    mutateUser((u) => ({ ...u, trips: u.trips.map((tr) => (tr.ref === ref ? { ...tr, ...patch } : tr)) }))
  }, [mutateUser])

  const removeTrip = useCallback((ref: string) => {
    mutateUser((u) => ({ ...u, trips: u.trips.filter((tr) => tr.ref !== ref) }))
  }, [mutateUser])

  const addNotification = useCallback((ref: string, n: TripNotification) => {
    mutateUser((u) => ({
      ...u,
      trips: u.trips.map((tr) => (tr.ref === ref ? { ...tr, notifications: [n, ...tr.notifications] } : tr)),
    }))
  }, [mutateUser])

  const markSaleOpen = useCallback((ref: string, n: TripNotification, patch?: Partial<SavedTrip>) => {
    mutateUser((u) => ({
      ...u,
      trips: u.trips.map((tr) => (tr.ref === ref
        ? { ...tr, ...patch, saleAlerted: true, notifications: [n, ...tr.notifications] }
        : tr)),
    }))
  }, [mutateUser])

  const setDefaultCard = useCallback((card: string) => {
    mutateUser((u) => ({ ...u, card }))
  }, [mutateUser])

  const value = useMemo<AppState>(() => ({
    lang, setLang, t,
    user: currentUser ? { name: currentUser.name, email: currentUser.email, card: currentUser.card } : null,
    login, register, logout, setDefaultCard,
    trips: currentUser?.trips ?? [],
    addTrip, updateTrip, removeTrip, addNotification, markSaleOpen,
  }), [lang, setLang, t, currentUser, login, register, logout, setDefaultCard, addTrip, updateTrip, removeTrip, addNotification, markSaleOpen])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

let refCounter = 0
export function genRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const t = Date.now().toString(36).toUpperCase()
  let h = (Date.now() >>> 0) ^ (refCounter++ * 2654435761)
  let out = 'SW-'
  for (let i = 0; i < 6; i++) {
    h = (Math.imul(h, 31) + t.charCodeAt(i % t.length) * 7 + i * 131) >>> 0
    out += chars[h % chars.length]
  }
  return out
}
