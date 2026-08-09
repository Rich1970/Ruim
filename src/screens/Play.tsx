import { useEffect, useMemo, useState } from 'react'
import { useNav } from '../lib/nav'
import { useStore } from '../lib/store'
import { speak, stopSpeaking } from '../lib/speech'
import { LightShell } from '../components/LightShell'
import { VoiceCapture } from '../components/VoiceCapture'
import { PROSPERITY_RESPONSES, PROSPERITY_EMPTY } from '../data/content'
import { euro } from '../lib/facts'
import { todayISO, isoWeek, uid, type RuimState } from '../lib/storage'

// Zorgt dat de storting van vandaag klaarstaat (onbesteed saldo vervalt).
function ensureToday(d: RuimState) {
  const today = todayISO()
  const year = new Date().getFullYear()
  if (d.prosperity.year !== year) {
    d.prosperity.year = year
    d.prosperity.yearlyTotal = 0
  }
  if (d.prosperity.lastDepositDate !== today) {
    d.prosperity.day = (d.prosperity.day || 0) + 1
    d.prosperity.lastDepositDate = today
    d.prosperity.remaining = d.prosperity.day * 1000
    d.prosperity.purchases = []
  }
}

export function Play() {
  const { state, update } = useStore()
  const { home } = useNav()

  useEffect(() => {
    update((d) => ensureToday(d))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <LightShell title="Spelen" onBack={home}>
      <div className="space-y-6 pb-8">
        <ProsperityGame />
        <WalletProcess />
        <RealSpend />
      </div>
    </LightShell>
  )
}

function ProsperityGame() {
  const { state, update } = useStore()
  const p = state.prosperity
  const s = state.settings
  const opts = { rate: s.voiceRate, voiceName: s.voiceName, elevenLabsKey: s.elevenLabsKey }
  const [item, setItem] = useState('')
  const [amount, setAmount] = useState('')
  const [flash, setFlash] = useState('')

  function spend(rawAmount: number, text: string) {
    if (rawAmount <= 0) return
    const amt = Math.min(rawAmount, p.remaining)
    update((d) => {
      d.prosperity.remaining = Math.max(0, d.prosperity.remaining - amt)
      d.prosperity.yearlyTotal += amt
      d.prosperity.purchases.push({ id: uid(), text: text || 'iets moois', amount: amt, date: todayISO() })
    })
    const remainingAfter = p.remaining - amt
    const line =
      remainingAfter <= 0
        ? PROSPERITY_EMPTY
        : PROSPERITY_RESPONSES[Math.floor((p.purchases.length) % PROSPERITY_RESPONSES.length)]
    setFlash(line)
    speak([line], opts)
    setItem('')
    setAmount('')
  }

  return (
    <section className="rounded-3xl border border-sand-200 bg-sand-50 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-ink">🎲 Prosperity Game</h2>
        <span className="text-sm text-ink-faint">dag {p.day}</span>
      </div>
      <p className="mt-1 text-sm text-ink-faint">
        Vandaag staat er {euro(p.day * 1000)} klaar. Geef het vandaag helemaal uit — wat overblijft, vervalt.
      </p>

      <div className="my-4 rounded-2xl bg-sand-100 p-4 text-center">
        <div className="text-3xl font-semibold text-clay-600">{euro(p.remaining)}</div>
        <div className="text-sm text-ink-faint">nog te besteden vandaag</div>
      </div>

      {p.remaining > 0 ? (
        <div className="space-y-2">
          <input
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Wat koop je? (bijv. een weekend weg)"
            className="w-full rounded-2xl border border-sand-200 bg-white px-4 py-3 text-ink outline-none"
          />
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="bedrag"
              className="flex-1 rounded-2xl border border-sand-200 bg-white px-4 py-3 text-ink outline-none"
            />
            <button
              onClick={() => spend(Number(amount) || 0, item)}
              className="rounded-2xl bg-clay-500 px-5 font-medium text-sand-50"
            >
              Koop
            </button>
          </div>
          <button
            onClick={() => spend(p.remaining, item || 'alles wat er nog was')}
            className="w-full rounded-2xl border border-sand-300 py-2 text-sm text-ink-soft"
          >
            besteed de rest ({euro(p.remaining)})
          </button>
        </div>
      ) : (
        <p className="rounded-2xl bg-moss-500/10 p-3 text-center text-moss-600">{PROSPERITY_EMPTY}</p>
      )}

      {flash && p.remaining > 0 && <p className="mt-3 text-center text-moss-600">{flash}</p>}

      {p.purchases.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-ink-soft">
          {p.purchases.map((x) => (
            <li key={x.id} className="flex justify-between">
              <span>{x.text}</span>
              <span>{euro(x.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-center text-sm text-ink-faint">
        Dit jaar met plezier uitgegeven: <span className="font-medium text-ink">{euro(p.yearlyTotal)}</span>
      </p>
    </section>
  )
}

function WalletProcess() {
  const { state, update } = useStore()
  const w = state.wallet
  const today = todayISO()
  const askedToday = w.lastDate === today

  if (w.amount <= 0) {
    return (
      <section className="rounded-3xl border border-sand-200 bg-sand-50 p-5">
        <h2 className="text-lg font-medium text-ink">👛 Wallet Process</h2>
        <p className="mt-1 text-sm text-ink-faint">
          Zet bij Instellingen het bedrag dat je echt op zak hebt. Dan kun je het elke dag opnieuw in gedachten uitgeven.
        </p>
      </section>
    )
  }

  function save(text: string) {
    update((d) => {
      d.wallet.lastDate = today
      d.wallet.count += 1
      if (text.trim()) d.wallet.history.push({ text: text.trim(), date: today })
    })
  }

  return (
    <section className="rounded-3xl border border-sand-200 bg-sand-50 p-5">
      <h2 className="text-lg font-medium text-ink">👛 Wallet Process</h2>
      <p className="mt-1 text-sm text-ink-faint">
        Je hebt {euro(w.amount)} op zak. Je hebt dat briefje al {w.count}× in gedachten uitgegeven.
      </p>
      {askedToday ? (
        <p className="mt-3 rounded-2xl bg-sand-100 p-3 text-center text-ink-soft">
          Vandaag gedaan. Morgen ligt er weer een {euro(w.amount)} klaar.
        </p>
      ) : (
        <div className="mt-3">
          <p className="mb-2 text-ink">Wat heb je vandaag mentaal gekocht met dat briefje?</p>
          <VoiceCapture onSubmit={save} submitLabel="Uitgegeven" rows={2} />
        </div>
      )}
    </section>
  )
}

function RealSpend() {
  const { state, update } = useStore()
  const r = state.realSpend
  const week = isoWeek()
  const doneThisWeek = r.lastWeek === week
  const [feeling, setFeeling] = useState(7)
  const [logging, setLogging] = useState(false)

  const trend = useMemo(() => r.history.slice(-10), [r.history])

  function complete() {
    update((d) => {
      d.realSpend.history.push({ amount: d.realSpend.currentAmount, feeling, date: todayISO() })
      d.realSpend.currentAmount = Math.round(d.realSpend.currentAmount * 1.25)
      d.realSpend.lastWeek = week
    })
    setLogging(false)
  }

  return (
    <section className="rounded-3xl border border-sand-200 bg-sand-50 p-5">
      <h2 className="text-lg font-medium text-ink">✨ Echte uitgeef-opdracht</h2>
      {doneThisWeek ? (
        <p className="mt-1 text-sm text-ink-faint">
          Deze week gedaan. Volgende week: {euro(r.currentAmount)} puur voor je plezier.
        </p>
      ) : (
        <>
          <p className="mt-1 text-ink">
            Geef deze week <span className="font-semibold text-clay-600">{euro(r.currentAmount)}</span> uit aan
            iets dat puur leuk is. Niets nuttigs.
          </p>
          {!logging ? (
            <button
              onClick={() => setLogging(true)}
              className="mt-3 w-full rounded-2xl bg-clay-500 py-3 font-medium text-sand-50"
            >
              Gedaan — hoe voelde dat?
            </button>
          ) : (
            <div className="mt-3">
              <p className="mb-2 text-ink">Van 0 tot 10 — hoe voelde dat?</p>
              <input
                type="range"
                min={0}
                max={10}
                value={feeling}
                onChange={(e) => setFeeling(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: '#b97250' }}
              />
              <div className="text-center text-2xl font-semibold text-clay-600">{feeling}</div>
              <button onClick={complete} className="mt-2 w-full rounded-2xl bg-moss-500 py-3 font-medium text-sand-50">
                Bewaar
              </button>
            </div>
          )}
        </>
      )}

      {trend.length > 1 && <FeelingTrend data={trend.map((t) => t.feeling)} />}
    </section>
  )
}

// Het enige lijntje in de hele app.
function FeelingTrend({ data }: { data: number[] }) {
  const w = 280
  const h = 60
  const max = 10
  const step = data.length > 1 ? w / (data.length - 1) : w
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(' ')
  return (
    <div className="mt-4">
      <p className="mb-1 text-xs text-ink-faint">hoe het voelde, in de tijd</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke="#b97250" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => (
          <circle key={i} cx={i * step} cy={h - (v / max) * h} r={2.5} fill="#9f5d3d" />
        ))}
      </svg>
    </div>
  )
}
