import { useEffect, useMemo, useRef, useState } from 'react'
import { useNav } from '../lib/nav'
import { useStore } from '../lib/store'
import { speak, stopSpeaking } from '../lib/speech'
import { LightShell, Prompt, NextButton } from '../components/LightShell'
import { VoiceCapture } from '../components/VoiceCapture'
import {
  REVISION_Q,
  REVISION_REPLAY,
  REVISION_CLOSE,
  POSITIVE_ASPECTS_Q,
  RAMPAGE_INTRO,
} from '../data/content'
import { uid, todayISO } from '../lib/storage'

type Step = 'revision-ask' | 'revision-replay' | 'aspects-pick' | 'aspects-say' | 'rampage' | 'sats' | 'done'

// Zachte toon aan het eind van een fase.
function softTone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 320
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.4)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.2)
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 2.3)
  } catch {
    /* geen geluid mogelijk */
  }
}

export function Evening() {
  const { home } = useNav()
  const { state, update } = useStore()
  const [step, setStep] = useState<Step>('revision-ask')
  const s = state.settings
  const opts = { rate: s.voiceRate, voiceName: s.voiceName, elevenLabsKey: s.elevenLabsKey }

  return (
    <LightShell title="Avond" tone="warm" onBack={home}>
      {step === 'revision-ask' && <RevisionAsk opts={opts} onDone={() => setStep('revision-replay')} />}
      {step === 'revision-replay' && <RevisionReplay opts={opts} onDone={() => setStep('aspects-pick')} />}
      {step === 'aspects-pick' && <AspectsPick onPick={() => setStep('aspects-say')} />}
      {step === 'aspects-say' && <AspectsSay opts={opts} onDone={() => setStep('rampage')} />}
      {step === 'rampage' && <Rampage opts={opts} onDone={() => setStep('sats')} />}
      {step === 'sats' && <EveningSats opts={opts} scene={s.satsScenes[s.satsSceneIndex] || s.satsScenes[0]} onClose={home} />}
    </LightShell>
  )
}

function RevisionAsk({ opts, onDone }: { opts: any; onDone: () => void }) {
  useEffect(() => {
    speak([REVISION_Q], opts)
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div>
      <Prompt>{REVISION_Q}</Prompt>
      <VoiceCapture autoStart onSubmit={onDone} submitLabel="Verder" rows={3} placeholder="Vertel het maar…" />
      <button onClick={onDone} className="mt-4 w-full text-sm text-ink-faint">
        er ging niets mis vandaag — sla over
      </button>
    </div>
  )
}

function RevisionReplay({ opts, onDone }: { opts: any; onDone: () => void }) {
  const [phase, setPhase] = useState<'replay' | 'silence' | 'close'>('replay')
  const [left, setLeft] = useState(120)

  useEffect(() => {
    speak([REVISION_REPLAY], { ...opts, onDone: () => setPhase('silence') })
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase !== 'silence') return
    const iv = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    const to = window.setTimeout(() => {
      speak([REVISION_CLOSE], { ...opts, onDone: () => setPhase('close') })
      window.clearInterval(iv)
    }, 120000)
    return () => {
      window.clearInterval(iv)
      window.clearTimeout(to)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="soft-circle mb-10 h-40 w-40 animate-breathe" />
      {phase === 'replay' && <p className="max-w-xs text-lg text-ink">{REVISION_REPLAY}</p>}
      {phase === 'silence' && (
        <>
          <p className="max-w-xs text-lg text-ink">Zie het gebeuren zoals je het gewild had. Voel hoe dat is.</p>
          <p className="mt-6 text-sm text-ink-faint">nog {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</p>
          <button
            onClick={() => {
              stopSpeaking()
              speak([REVISION_CLOSE], { ...opts, onDone })
              setPhase('close')
            }}
            className="mt-6 text-sm text-ink-faint"
          >
            ik heb het gezien — verder
          </button>
        </>
      )}
      {phase === 'close' && (
        <>
          <p className="max-w-xs text-lg text-ink">{REVISION_CLOSE}</p>
          <NextButton onClick={onDone} />
        </>
      )}
    </div>
  )
}

const DEFAULT_SUBJECTS = ['mijn werk', 'mijn lijf', 'mijn huis', 'deze dag', 'een vriend']

function AspectsPick({ onPick }: { onPick: () => void }) {
  const { state, update } = useStore()
  const people = useMemo(() => {
    const names = Array.from(new Set(state.people.map((p) => p.name)))
    return names.slice(-8)
  }, [state.people])
  const [custom, setCustom] = useState('')

  function pick(subject: string) {
    update((d) => {
      ;(d as any)._aspectSubject = subject
    })
    onPick()
  }

  const chips = [...people, ...DEFAULT_SUBJECTS]

  return (
    <div>
      <Prompt>Waar wil je iets goeds over zeggen?</Prompt>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => pick(c)}
            className="rounded-full border border-sand-300 bg-sand-50 px-4 py-2 text-ink-soft"
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="of iets anders…"
          className="flex-1 rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-ink outline-none"
        />
        <button
          onClick={() => custom.trim() && pick(custom.trim())}
          className="rounded-2xl bg-clay-500 px-5 text-sand-50"
        >
          Kies
        </button>
      </div>
    </div>
  )
}

function AspectsSay({ opts, onDone }: { opts: any; onDone: () => void }) {
  const { state, update } = useStore()
  const subject = (state as any)._aspectSubject || 'deze dag'
  const [left, setLeft] = useState(60)

  useEffect(() => {
    speak([POSITIVE_ASPECTS_Q(subject)], opts)
    const iv = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => {
      stopSpeaking()
      window.clearInterval(iv)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function save(text: string) {
    if (text.trim()) {
      update((d) => {
        d.positiveAspects.push({ id: uid(), subject, text: text.trim(), date: todayISO() })
      })
    }
    onDone()
  }

  return (
    <div>
      <Prompt>Noem zestig seconden lang alles wat er goed is aan {subject}.</Prompt>
      <p className="mb-4 text-sm text-ink-faint">nog {left}s</p>
      <VoiceCapture autoStart onSubmit={save} submitLabel="Bewaar" rows={4} placeholder="Alles wat er goed aan is…" />
    </div>
  )
}

function Rampage({ opts, onDone }: { opts: any; onDone: () => void }) {
  const { update } = useStore()
  const [left, setLeft] = useState(90)
  const doneRef = useRef(false)

  useEffect(() => {
    speak([RAMPAGE_INTRO], opts)
    const iv = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1 && !doneRef.current) {
          doneRef.current = true
          softTone()
        }
        return Math.max(0, l - 1)
      })
    }, 1000)
    return () => {
      stopSpeaking()
      window.clearInterval(iv)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function save(text: string) {
    if (text.trim()) {
      update((d) => {
        d.rampages.push({ id: uid(), text: text.trim(), date: todayISO() })
      })
    }
    onDone()
  }

  return (
    <div>
      <Prompt>Waar ben je dankbaar voor? Laat het maar stromen. Ik onderbreek je niet.</Prompt>
      <p className="mb-4 text-sm text-ink-faint">{left > 0 ? `nog ${left}s` : 'de tijd is voorbij — neem je tijd'}</p>
      <VoiceCapture autoStart onSubmit={save} submitLabel="Bewaar" rows={5} placeholder="…" />
    </div>
  )
}

function EveningSats({ opts, scene, onClose }: { opts: any; scene: string; onClose: () => void }) {
  useEffect(() => {
    const sentences = scene.split(/(?<=[.!?])\s+/).filter(Boolean)
    speak(sentences, { ...opts, gapMs: 2200, startDelayMs: 600, volume: 0.85 })
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="soft-circle mb-10 h-36 w-36 animate-breathe" style={{ ['--breathe-dur' as any]: '11s' }} />
      <p className="max-w-xs text-lg text-ink-soft">Neem dit mee de nacht in.</p>
      <NextButton onClick={onClose} label="Welterusten" />
    </div>
  )
}
