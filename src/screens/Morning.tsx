import { useEffect, useState } from 'react'
import { useNav } from '../lib/nav'
import { useStore } from '../lib/store'
import { speak, stopSpeaking } from '../lib/speech'
import { LightShell, Prompt, NextButton } from '../components/LightShell'
import { EmotionalScale } from '../components/EmotionalScale'
import { SpokenList } from '../components/SpokenList'
import { VoiceCapture } from '../components/VoiceCapture'
import {
  higherThoughts,
  SEGMENT_INTRO,
  ENTHUSIASM_Q1,
  ENTHUSIASM_Q2,
  ENTHUSIASM_Q3,
  ENTHUSIASM_RELEASE,
} from '../data/content'

type Step = 'scale' | 'thoughts' | 'segment' | 'enthusiasm' | 'nightlist' | 'done'

export function Morning() {
  const { home } = useNav()
  const { state } = useStore()
  const [step, setStep] = useState<Step>('scale')
  const [scaleIndex, setScaleIndex] = useState(10)
  const s = state.settings
  const opts = { rate: s.voiceRate, voiceName: s.voiceName, elevenLabsKey: s.elevenLabsKey }

  const hasNightItems = state.items.some((i) => !i.resolved)

  // Een pas-herschreven overtuiging wordt een week lang elke ochtend teruggelezen.
  useEffect(() => {
    const active = state.beliefs.filter((b) => b.readUntil > Date.now())
    if (active.length && step === 'scale') {
      const latest = active[active.length - 1]
      speak(['Je nieuwe definitie:', latest.newDefinition], { ...opts, gapMs: 1500 })
    }
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <LightShell title="Ochtend" onBack={() => (step === 'scale' ? home() : home())}>
      {step === 'scale' && (
        <div className="flex flex-col items-center">
          <Prompt>Waar sta je nu?</Prompt>
          <EmotionalScale
            onConfirm={(idx) => {
              setScaleIndex(idx)
              setStep('thoughts')
            }}
          />
        </div>
      )}

      {step === 'thoughts' && (
        <div>
          <Prompt>Een paar gedachten die net iets lichter liggen.</Prompt>
          <SpokenList lines={higherThoughts(scaleIndex)} opts={opts} />
          <NextButton onClick={() => setStep('segment')} />
        </div>
      )}

      {step === 'segment' && <SegmentIntending opts={opts} onDone={() => setStep('enthusiasm')} />}

      {step === 'enthusiasm' && <Enthusiasm opts={opts} onDone={() => setStep(hasNightItems ? 'nightlist' : 'done')} />}

      {step === 'nightlist' && <NightList onDone={() => setStep('done')} />}

      {step === 'done' && <MorningDone opts={opts} onClose={home} />}
    </LightShell>
  )
}

// Segment Intending — zoveel delen als je wilt (typisch 5 tot 7).
function SegmentIntending({ opts, onDone }: { opts: any; onDone: () => void }) {
  const [sub, setSub] = useState<'name' | 'feel'>('name')
  const [i, setI] = useState(0) // index van het deel waar we nu mee bezig zijn
  const [parts, setParts] = useState<string[]>([])
  const [feels, setFeels] = useState<string[]>([])
  const [reading, setReading] = useState(false)

  const partLabel = (p?: string) => (p && p.trim() ? p.trim() : 'dat deel van je dag')
  const nameQuestion = (n: number) =>
    n === 0 ? SEGMENT_INTRO : 'En het volgende deel van je dag?'

  useEffect(() => {
    if (sub === 'name') speak([nameQuestion(i)], opts)
    // De vervolgvraag herhaalt hardop wat je net zei.
    else speak([`${partLabel(parts[i])}. Hoe wil je je daarin voelen?`], opts)
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, sub])

  function submitName(t: string) {
    const next = [...parts]
    next[i] = t.trim()
    setParts(next)
    setSub('feel')
  }
  function submitFeel(t: string) {
    const nf = [...feels]
    nf[i] = t.trim() || 'rustig'
    setFeels(nf)
    setI(i + 1) // volgende deel; je stopt zelf met "Klaar"
    setSub('name')
  }

  // Ronde af met de delen die je tot nu toe hebt genoemd.
  function finish() {
    stopSpeaking()
    readBack(parts.slice(0, i), feels.slice(0, i))
  }

  function readBack(p: string[], f: string[]) {
    setReading(true)
    const lines = [
      'Dit is je intentie voor vandaag.',
      ...p.map((part, idx) => `In ${partLabel(part)} wil je je ${f[idx] || 'rustig'} voelen.`),
      'Zo ga je de dag in.',
    ]
    speak(lines, { ...opts, gapMs: 2500 })
  }

  if (reading) {
    const done = parts.slice(0, feels.length)
    return (
      <div>
        <Prompt>Je intentie voor vandaag</Prompt>
        <ul className="space-y-3 text-lg text-ink">
          {done.map((p, idx) => (
            <li key={idx}>
              In <span className="font-medium">{partLabel(p)}</span> wil je je{' '}
              <span className="font-medium">{feels[idx] || 'rustig'}</span> voelen.
            </li>
          ))}
        </ul>
        <NextButton onClick={onDone} />
      </div>
    )
  }

  const completed = parts.slice(0, i) // volledig afgeronde delen (naam + gevoel)

  return (
    <div>
      <Prompt>
        {sub === 'name'
          ? i === 0
            ? 'Uit welke stukken bestaat je dag? Noem het eerste deel.'
            : 'En het volgende deel van je dag?'
          : `${partLabel(parts[i])} — hoe wil je je daarin voelen?`}
      </Prompt>

      {/* Wat je al genoemd hebt, als geruststelling */}
      {completed.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {completed.map((p, idx) => (
            <span key={idx} className="rounded-full bg-sand-100 px-3 py-1 text-sm text-ink-soft">
              {partLabel(p)} · {feels[idx] || 'rustig'}
            </span>
          ))}
        </div>
      )}

      <VoiceCapture
        key={`${i}-${sub}`}
        autoStart
        onSubmit={sub === 'name' ? submitName : submitFeel}
        submitLabel="Verder"
        placeholder={sub === 'name' ? 'bijv. de ochtend, een gesprek, de lunch…' : 'bijv. rustig, scherp, licht…'}
        rows={2}
      />

      {/* Afronden mag zodra er minstens één deel af is */}
      {sub === 'name' && i >= 1 && (
        <button onClick={finish} className="mt-4 w-full rounded-2xl border border-sand-300 py-3 text-ink-soft">
          Klaar — lees mijn intentie terug ({i} {i === 1 ? 'deel' : 'delen'})
        </button>
      )}

      <p className="mt-4 text-center text-sm text-ink-faint">
        {sub === 'name' ? `deel ${i + 1}` : `deel ${i + 1} — hoe wil je je voelen?`} · zoveel delen als je wilt
      </p>
    </div>
  )
}

// Hoogste enthousiasme (Bashar)
function Enthusiasm({ opts, onDone }: { opts: any; onDone: () => void }) {
  const [q, setQ] = useState(0)
  const [a1, setA1] = useState('')
  const [a2, setA2] = useState('')
  const [released, setReleased] = useState(false)
  const questions = [ENTHUSIASM_Q1, ENTHUSIASM_Q2, ENTHUSIASM_Q3]

  useEffect(() => {
    if (q < 3) speak([questions[q]], opts)
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  function submit(t: string) {
    if (q === 0) setA1(t)
    if (q === 1) setA2(t)
    if (q === 2) {
      setReleased(true)
      speak([ENTHUSIASM_RELEASE], { ...opts, startDelayMs: 300 })
      return
    }
    setQ(q + 1)
  }

  if (released) {
    return (
      <div>
        <Prompt>{ENTHUSIASM_RELEASE}</Prompt>
        <div className="rounded-2xl bg-sand-100 p-4 text-ink-soft">
          <p className="text-sm text-ink-faint">Het meest opwindende:</p>
          <p className="mb-2">{a1 || '—'}</p>
          <p className="text-sm text-ink-faint">De kleinste stap:</p>
          <p>{a2 || '—'}</p>
        </div>
        <NextButton onClick={onDone} />
      </div>
    )
  }

  return (
    <div>
      <Prompt>{questions[q]}</Prompt>
      <VoiceCapture key={q} autoStart onSubmit={submit} submitLabel="Verder" rows={2} />
    </div>
  )
}

// Nachtlijst — items uit de nacht/urgent, met "achteraf gezien viel dit mee".
function NightList({ onDone }: { onDone: () => void }) {
  const { state, update } = useStore()
  const items = state.items.filter((i) => !i.resolved)

  function markSmaller(id: string, smaller: boolean) {
    update((d) => {
      const it = d.items.find((x) => x.id === id)
      if (it) {
        it.resolved = true
        it.wasSmaller = smaller
        if (smaller) d.nightWorriesSmaller += 1
      }
    })
  }

  const remaining = state.items.filter((i) => !i.resolved).length

  return (
    <div>
      <Prompt>Dit hield je vannacht bezig. Kijk er nu naar met een heldere kop.</Prompt>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.id} className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
            <p className="mb-3 text-ink">{it.text}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => markSmaller(it.id, true)}
                className="rounded-xl bg-moss-500 px-3 py-2 text-sm text-sand-50"
              >
                achteraf gezien viel dit mee
              </button>
              <button
                onClick={() => markSmaller(it.id, false)}
                className="rounded-xl border border-sand-300 px-3 py-2 text-sm text-ink-soft"
              >
                pak ik nu op
              </button>
            </div>
          </li>
        ))}
      </ul>
      {state.nightWorriesTotal > 0 && (
        <p className="mt-6 rounded-2xl bg-sand-100 px-4 py-3 text-center text-ink-soft">
          {state.nightWorriesSmaller} van de {state.nightWorriesTotal} nachtzorgen bleken overdag kleiner.
        </p>
      )}
      <NextButton onClick={onDone} label={remaining > 0 ? 'Laat de rest even staan' : 'Klaar'} />
    </div>
  )
}

function MorningDone({ opts, onClose }: { opts: any; onClose: () => void }) {
  useEffect(() => {
    speak(['Zo. Je staat er. Fijne dag.'], opts)
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="soft-circle mb-8 h-24 w-24" />
      <p className="text-xl text-ink">Zo. Je staat er.</p>
      <p className="mt-1 text-ink-faint">Fijne dag.</p>
      <NextButton onClick={onClose} label="Sluiten" />
    </div>
  )
}
