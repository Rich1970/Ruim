import { useMemo, useState } from 'react'
import { useNav } from '../lib/nav'
import { useStore } from '../lib/store'
import { speak, stopSpeaking } from '../lib/speech'
import { LightShell } from '../components/LightShell'
import { ABUNDANCE_DEFINITION } from '../data/content'
import { todayISO, isoWeek } from '../lib/storage'

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function Abundance() {
  const { home } = useNav()
  const { state, update } = useStore()
  const s = state.settings
  const opts = { rate: s.voiceRate, voiceName: s.voiceName, elevenLabsKey: s.elevenLabsKey }

  const [forMe, setForMe] = useState('')
  const [byMe, setByMe] = useState('')

  function add(direction: 'for-me' | 'by-me', name: string) {
    const n = name.trim()
    if (!n) return
    update((d) => {
      d.people.push({ name: n, date: todayISO(), direction })
    })
    if (direction === 'for-me') setForMe('')
    else setByMe('')
  }

  // Namen + frequentie voor het sterrenveld.
  const stars = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of state.people) counts.set(p.name, (counts.get(p.name) || 0) + 1)
    return Array.from(counts.entries()).map(([name, count]) => {
      const hx = hash(name)
      const hy = hash(name + '·y')
      return {
        name,
        count,
        x: 6 + (hx % 88),
        y: 8 + (hy % 82),
      }
    })
  }, [state.people])

  const maxCount = Math.max(1, ...stars.map((s) => s.count))

  const thisWeekNames = useMemo(() => {
    const w = isoWeek()
    const names = state.people.filter((p) => isoWeek(new Date(p.date)) === w).map((p) => p.name)
    return Array.from(new Set(names))
  }, [state.people])

  function readWeek() {
    if (!thisWeekNames.length) {
      speak(['Deze week nog geen namen. Wie was er deze week even voor jou?'], opts)
      return
    }
    speak(
      [`Deze week waren dit de mensen.`, thisWeekNames.join(', ') + '.', 'Dat is ook vermogen.'],
      { ...opts, gapMs: 1800 },
    )
  }

  function playAspect() {
    if (!state.positiveAspects.length) {
      speak(['Nog geen positieve aspecten opgeslagen. Voeg er ’s avonds een toe.'], opts)
      return
    }
    const pick = state.positiveAspects[hash(todayISO() + state.positiveAspects.length) % state.positiveAspects.length]
    speak([`Over ${pick.subject}:`, pick.text], { ...opts, gapMs: 1500 })
  }

  const askedToday = state.people.some((p) => p.date === todayISO())

  return (
    <LightShell title="Overvloed" onBack={home}>
      <div className="space-y-6 pb-8">
        {/* Dagelijkse twee vragen */}
        <section className="rounded-3xl border border-sand-200 bg-sand-50 p-5">
          <h2 className="text-lg font-medium text-ink">Wie was er vandaag voor jou?</h2>
          <div className="mt-2 flex gap-2">
            <input
              value={forMe}
              onChange={(e) => setForMe(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add('for-me', forMe)}
              placeholder="een naam…"
              className="flex-1 rounded-2xl border border-sand-200 bg-white px-4 py-3 text-ink outline-none"
            />
            <button onClick={() => add('for-me', forMe)} className="rounded-2xl bg-clay-500 px-5 text-sand-50">
              +
            </button>
          </div>

          <h2 className="mt-5 text-lg font-medium text-ink">Voor wie was jij er?</h2>
          <div className="mt-2 flex gap-2">
            <input
              value={byMe}
              onChange={(e) => setByMe(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add('by-me', byMe)}
              placeholder="een naam…"
              className="flex-1 rounded-2xl border border-sand-200 bg-white px-4 py-3 text-ink outline-none"
            />
            <button onClick={() => add('by-me', byMe)} className="rounded-2xl bg-moss-500 px-5 text-sand-50">
              +
            </button>
          </div>
          {askedToday && <p className="mt-3 text-sm text-ink-faint">Genoteerd. Je mag er zoveel toevoegen als je wilt.</p>}
        </section>

        {/* Sterrenveld */}
        <section className="rounded-3xl border border-night-soft/40 bg-night-bg p-5">
          <h2 className="mb-1 text-lg font-medium text-night-text">Je overvloed aan mensen</h2>
          <p className="mb-3 text-sm text-night-soft">Namen die vaker terugkomen, worden helderder.</p>
          <div className="relative h-64 w-full overflow-hidden rounded-2xl">
            {stars.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-night-soft/60">
                nog leeg — voeg een naam toe
              </p>
            )}
            {stars.map((st) => {
              const bright = 0.35 + 0.65 * (st.count / maxCount)
              const size = 12 + 4 * st.count
              return (
                <span
                  key={st.name}
                  className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                  style={{
                    left: `${st.x}%`,
                    top: `${st.y}%`,
                    color: `rgba(196,150,110,${bright})`,
                    fontSize: `${Math.min(size, 22)}px`,
                    textShadow: `0 0 ${6 * bright}px rgba(196,150,110,${bright})`,
                  }}
                >
                  {st.name}
                </span>
              )
            })}
          </div>
        </section>

        {/* Bashar-definitie */}
        <section className="rounded-3xl bg-sand-100 p-5">
          <p className="text-ink">{ABUNDANCE_DEFINITION}</p>
          <button
            onClick={() => speak([ABUNDANCE_DEFINITION], opts)}
            className="mt-3 text-sm text-ink-faint"
          >
            ▶ lees voor
          </button>
        </section>

        {/* Wekelijks teruglezen + positieve aspecten */}
        <div className="flex gap-3">
          <button onClick={readWeek} className="flex-1 rounded-2xl border border-sand-300 bg-sand-50 py-4 text-ink-soft">
            Lees deze week voor
          </button>
          <button onClick={playAspect} className="flex-1 rounded-2xl border border-sand-300 bg-sand-50 py-4 text-ink-soft">
            Speel iets moois af
          </button>
        </div>
      </div>
    </LightShell>
  )
}
