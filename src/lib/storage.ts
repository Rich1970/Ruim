// Ruim — opslaglaag over localStorage.
// Alle data blijft op het toestel. Eén JSON-object, met export/import.

const KEY = 'ruim.v1'

export type ListItemSource = 'night' | 'urgent' | 'manual'

export interface ListItem {
  id: string
  text: string
  source: ListItemSource
  createdAt: number
  dueAt: number // eerstvolgende 9:00 na aanmaken
  respondAfter?: number // urgent: reageren mag pas na dit tijdstip (24u)
  resolved: boolean
  wasSmaller: boolean | null // "achteraf gezien viel dit mee"
}

export interface Facts {
  filled: boolean
  total: number // totaal vermogen
  monthlyFixed: number // vaste maandlasten privé
  passiveIncome: number // maandelijks passief inkomen
  freedomNumber: number // vrijheidsgetal (passief inkomen p/m waarbij werken optioneel is)
}

export interface ProsperityState {
  day: number // stortingsdag: 1 => €1000, 2 => €2000, ...
  lastDepositDate: string // YYYY-MM-DD
  remaining: number // saldo van vandaag dat nog uitgegeven mag worden
  purchases: { id: string; text: string; amount: number; date: string }[]
  year: number
  yearlyTotal: number // met plezier uitgegeven dit jaar
}

export interface WalletState {
  amount: number // bedrag dat hij echt op zak heeft
  lastDate: string
  count: number // hoe vaak mentaal uitgegeven
  history: { text: string; date: string }[]
}

export interface RealSpendEntry {
  amount: number
  feeling: number // 0..10
  date: string
  note?: string
}

export interface RealSpendState {
  currentAmount: number // volgende opdracht (start €25, +25% per week)
  lastWeek: string // ISO jaar-week waarin laatst gedaan
  history: RealSpendEntry[]
}

export interface PersonEntry {
  name: string
  date: string
  direction: 'for-me' | 'by-me'
}

export interface PositiveAspect {
  id: string
  subject: string
  text: string
  date: string
}

export interface Rampage {
  id: string
  text: string
  date: string
}

export interface Belief {
  id: string
  feeling: string
  worldBelief: string
  selfBelief: string
  origin: string
  whoWithout: string
  newDefinition: string
  date: string
  readUntil: number // ochtend-terugleesperiode (1 week)
}

export interface Settings {
  satsSceneIndex: number
  satsScenes: string[]
  elevenLabsKey: string
  voiceRate: number
  voiceName: string // gekozen browserstem (leeg = auto)
}

export interface RuimState {
  version: 1
  createdAt: number
  lastVisit: number
  facts: Facts
  items: ListItem[]
  nightWorriesTotal: number
  nightWorriesSmaller: number
  prosperity: ProsperityState
  wallet: WalletState
  realSpend: RealSpendState
  people: PersonEntry[]
  positiveAspects: PositiveAspect[]
  rampages: Rampage[]
  beliefs: Belief[]
  lastVR: string // datum laatste Virtual Reality-proces
  settings: Settings
}

export const DEFAULT_SATS_SCENES: string[] = [
  // Scène 1 — standaard, zoals in de opdracht
  'Het is een gewone ochtend. Je wordt wakker zonder wekker. ' +
    'Het licht komt schuin door het raam. Je hoort koffie. ' +
    'Je pakt je telefoon en je legt hem weer weg, want er is niets dat nu moet. ' +
    'Je loopt naar buiten, de lucht is koel. ' +
    'Je denkt aan de dag en er komt iets omhoog dat op zin lijkt. ' +
    'Ergens in huis lacht iemand. Zo is het nu. Zo is het gewoon geworden.',
  // Scène 2 — ruimte
  'Je zit ergens waar je graag bent. Er is niets dat af moet vandaag. ' +
    'Je voelt de stoel onder je, warm hout, een deken. ' +
    'Buiten beweegt het licht traag door de bomen. ' +
    'Iemand die je vertrouwt is in de buurt, je hoeft niets te zeggen. ' +
    'Er is meer dan genoeg tijd. Er is altijd meer dan genoeg tijd geweest. ' +
    'Je ademt uit en je schouders zakken. Zo voelt ruimte. Zo is het nu.',
  // Scène 3 — gemak
  'Je loopt door een dag die vanzelf gaat. Wat gedaan moet worden, doe je, ' +
    'wanneer het zich aandient, zonder haast. ' +
    'Je zegt ja tegen wat leuk is en dat is genoeg. ' +
    'Onderweg kom je iemand tegen en het gesprek voelt licht. ' +
    'Je merkt dat je glimlacht zonder reden. ' +
    'Alles wat je nodig hebt, is er al. Je hoeft het alleen maar toe te laten. Zo is het gewoon geworden.',
]

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function defaultState(): RuimState {
  const now = Date.now()
  return {
    version: 1,
    createdAt: now,
    lastVisit: now,
    facts: { filled: false, total: 0, monthlyFixed: 0, passiveIncome: 0, freedomNumber: 0 },
    items: [],
    nightWorriesTotal: 0,
    nightWorriesSmaller: 0,
    prosperity: {
      day: 0,
      lastDepositDate: '',
      remaining: 0,
      purchases: [],
      year: new Date().getFullYear(),
      yearlyTotal: 0,
    },
    wallet: { amount: 0, lastDate: '', count: 0, history: [] },
    realSpend: { currentAmount: 25, lastWeek: '', history: [] },
    people: [],
    positiveAspects: [],
    rampages: [],
    beliefs: [],
    lastVR: '',
    settings: {
      satsSceneIndex: 0,
      satsScenes: [...DEFAULT_SATS_SCENES],
      elevenLabsKey: '',
      voiceRate: 0.85,
      voiceName: '',
    },
  }
}

// Diepe merge van defaults zodat nieuwe velden nooit ontbreken na een update.
function withDefaults(loaded: any): RuimState {
  const base = defaultState()
  if (!loaded || typeof loaded !== 'object') return base
  return {
    ...base,
    ...loaded,
    facts: { ...base.facts, ...(loaded.facts || {}) },
    prosperity: { ...base.prosperity, ...(loaded.prosperity || {}) },
    wallet: { ...base.wallet, ...(loaded.wallet || {}) },
    realSpend: { ...base.realSpend, ...(loaded.realSpend || {}) },
    settings: {
      ...base.settings,
      ...(loaded.settings || {}),
      satsScenes:
        loaded.settings?.satsScenes && loaded.settings.satsScenes.length
          ? loaded.settings.satsScenes
          : base.settings.satsScenes,
    },
    items: Array.isArray(loaded.items) ? loaded.items : [],
    people: Array.isArray(loaded.people) ? loaded.people : [],
    positiveAspects: Array.isArray(loaded.positiveAspects) ? loaded.positiveAspects : [],
    rampages: Array.isArray(loaded.rampages) ? loaded.rampages : [],
    beliefs: Array.isArray(loaded.beliefs) ? loaded.beliefs : [],
  }
}

export function loadState(): RuimState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState()
    return withDefaults(JSON.parse(raw))
  } catch {
    return defaultState()
  }
}

export function saveState(state: RuimState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Opslag vol of geblokkeerd — stil falen, de app blijft werken in het geheugen.
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Eerstvolgende 9:00 vanaf een tijdstip.
export function next9am(from: number = Date.now()): number {
  const d = new Date(from)
  const target = new Date(d)
  target.setHours(9, 0, 0, 0)
  if (target.getTime() <= from) target.setDate(target.getDate() + 1)
  return target.getTime()
}

export function isoWeek(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const week =
    1 +
    Math.round(
      ((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
    )
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export { todayISO }

// Back-up exporteren als bestand.
export function exportBackup(state: RuimState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `ruim-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function importBackup(file: File): Promise<RuimState> {
  const text = await file.text()
  const parsed = JSON.parse(text)
  return withDefaults(parsed)
}
