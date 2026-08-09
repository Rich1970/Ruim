import { useEffect, useState } from 'react'
import { useNav } from '../lib/nav'
import { useStore } from '../lib/store'
import { WELCOME_BACK } from '../data/content'

export function Home() {
  const { go } = useNav()
  const { state, update } = useStore()
  const [welcomeBack, setWelcomeBack] = useState(false)

  useEffect(() => {
    const daysAway = (Date.now() - state.lastVisit) / 86400000
    if (daysAway >= 3) setWelcomeBack(true)
    update((d) => {
      d.lastVisit = Date.now()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hour = new Date().getHours()
  const greeting =
    hour < 5 ? 'Het is nacht.' : hour < 12 ? 'Goedemorgen.' : hour < 18 ? 'Goedemiddag.' : 'Goedenavond.'

  const buttons: { key: any; emoji: string; title: string; sub: string; tone: string }[] = [
    { key: 'night', emoji: '🌙', title: 'Nacht', sub: 'wakker geworden, kan niet slapen', tone: 'bg-night-glow text-night-text border-night-soft/60' },
    { key: 'morning', emoji: '☀️', title: 'Ochtend', sub: 'dag beginnen', tone: 'bg-sand-100 text-ink border-sand-200' },
    { key: 'evening', emoji: '🌆', title: 'Avond', sub: 'dag afsluiten', tone: 'bg-sand-200 text-ink border-sand-300' },
    { key: 'urgent', emoji: '⚡', title: 'Nu even niet oké', sub: 'dip, factuur, bericht, druk moment', tone: 'bg-clay-500 text-sand-50 border-clay-600' },
  ]

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-28 pt-10">
        <header className="mb-6 veld-fade">
          <div className="flex items-center gap-2">
            <div className="soft-circle h-7 w-7" />
            <h1 className="font-serif text-2xl text-ink">Ruim</h1>
          </div>
          <p className="mt-3 text-ink-faint">{greeting}</p>
          {welcomeBack && (
            <p className="mt-2 rounded-2xl bg-sand-100 px-4 py-3 text-ink-soft">{WELCOME_BACK}</p>
          )}
        </header>

        <div className="flex flex-col gap-4">
          {buttons.map((b) => (
            <button
              key={b.key}
              onClick={() => go(b.key)}
              className={`w-full rounded-3xl border px-6 py-6 text-left shadow-sm transition active:scale-[0.98] ${b.tone}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{b.emoji}</span>
                <div>
                  <div className="text-xl font-medium">{b.title}</div>
                  <div className="text-sm opacity-70">{b.sub}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-auto" />
      </div>

      <BottomNav />
    </div>
  )
}

function BottomNav() {
  const { go } = useNav()
  const items: { key: any; label: string; emoji: string }[] = [
    { key: 'play', label: 'Spelen', emoji: '🎲' },
    { key: 'abundance', label: 'Overvloed', emoji: '🤝' },
    { key: 'facts', label: 'Feiten', emoji: '📊' },
    { key: 'settings', label: 'Instellingen', emoji: '⚙️' },
  ]
  return (
    <nav
      className="fixed inset-x-0 bottom-0 border-t border-sand-200 bg-sand-50/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {items.map((i) => (
          <button
            key={i.key}
            onClick={() => go(i.key)}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-ink-faint active:bg-sand-100"
          >
            <span className="text-lg">{i.emoji}</span>
            <span className="text-xs">{i.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
