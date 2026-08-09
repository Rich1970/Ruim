import { useEffect, useRef, useState } from 'react'
import { useNav } from '../lib/nav'
import { useStore } from '../lib/store'
import { speak, stopSpeaking } from '../lib/speech'
import { NIGHT_PERMISSION, NIGHT_LADDERS, SATS_LOOP_LINE } from '../data/content'
import { uid, next9am } from '../lib/storage'
import { VoiceCapture } from '../components/VoiceCapture'

type Phase = 'permission' | 'park' | 'parked' | 'breath' | 'ladder' | 'sats' | 'done'

export function Night() {
  const { home } = useNav()
  const { state, update } = useStore()
  const [phase, setPhase] = useState<Phase>('permission')
  const [voiceStopped, setVoiceStopped] = useState(false)
  const s = state.settings

  const speakOpts = {
    rate: s.voiceRate,
    voiceName: s.voiceName,
    elevenLabsKey: s.elevenLabsKey,
    volume: 0.9,
  }

  function onTapStop() {
    stopSpeaking()
    setVoiceStopped(true)
  }

  // Fase 1 — Toestemming
  useEffect(() => {
    if (phase !== 'permission') return
    setVoiceStopped(false)
    speak(NIGHT_PERMISSION, {
      ...speakOpts,
      gapMs: 3000,
      startDelayMs: 800,
      onDone: () => setPhase('park'),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Fase 2 — Parkeren: prompt voorlezen
  useEffect(() => {
    if (phase !== 'park') return
    setVoiceStopped(false)
    speak(['Waar gaan je gedachten naartoe? Zeg het hardop, of tik als je het liever niet zegt.'], {
      ...speakOpts,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function saveWorry(text: string) {
    if (text.trim()) {
      update((d) => {
        d.items.push({
          id: uid(),
          text: text.trim(),
          source: 'night',
          createdAt: Date.now(),
          dueAt: next9am(),
          resolved: false,
          wasSmaller: null,
        })
        d.nightWorriesTotal += 1
      })
    }
    setPhase('parked')
  }

  // Bevestiging na parkeren
  useEffect(() => {
    if (phase !== 'parked') return
    setVoiceStopped(false)
    speak(
      [
        'Genoteerd. Dit staat morgenochtend om negen uur op je lijst, met een heldere kop.',
        'Je hoeft het nu niet meer vast te houden. Ik houd het voor je vast.',
      ],
      { ...speakOpts, gapMs: 2500, onDone: () => setPhase('breath') },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-night-bg text-night-text no-select"
      onClick={phase === 'park' ? undefined : onTapStop}
    >
      {/* subtiele sluitknop, altijd bereikbaar */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          stopSpeaking()
          home()
        }}
        className="absolute right-5 top-5 z-10 text-night-soft/60 text-sm"
      >
        sluiten
      </button>

      {phase === 'permission' && <CenterCircle variant="pulse" />}

      {phase === 'park' && (
        <div className="flex min-h-full flex-col items-center justify-center px-6" onClick={(e) => e.stopPropagation()}>
          <div className="mb-8 soft-circle h-24 w-24 opacity-60" />
          <p className="mb-6 max-w-xs text-center text-lg text-night-text">
            Waar gaan je gedachten naartoe?
          </p>
          <div className="w-full max-w-sm">
            <VoiceCapture
              dark
              autoStart
              placeholder="Zeg het hardop, of tik het in…"
              submitLabel="Genoteerd"
              onSubmit={saveWorry}
              rows={3}
            />
            <button
              onClick={() => {
                stopSpeaking()
                setPhase('breath')
              }}
              className="mt-4 w-full rounded-2xl border border-night-soft/40 py-3 text-night-soft"
            >
              sla over
            </button>
          </div>
        </div>
      )}

      {phase === 'parked' && (
        <CenterCircle variant="pulse" caption="Ik houd het voor je vast." />
      )}

      {phase === 'breath' && <BreathPhase opts={speakOpts} onDone={() => setPhase('ladder')} />}

      {phase === 'ladder' && (
        <LadderPhase
          opts={speakOpts}
          ladderIndex={ladderRotation(state.createdAt)}
          onDone={() => setPhase('sats')}
        />
      )}

      {phase === 'sats' && (
        <SatsPhase
          opts={speakOpts}
          scene={s.satsScenes[s.satsSceneIndex] || s.satsScenes[0]}
          onFinish={() => setPhase('done')}
        />
      )}

      {phase === 'done' && <div className="min-h-full bg-night-bg" />}

      {/* Wanneer de stem is gestopt door een tik: een zachte hint (niet in park) */}
      {voiceStopped && phase !== 'park' && phase !== 'sats' && phase !== 'done' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 text-center text-xs text-night-soft/50">
          tik nogmaals om te sluiten · of wacht
        </div>
      )}
    </div>
  )
}

// Rouleert per nacht over de drie ladders (op basis van de dag).
function ladderRotation(seed: number): number {
  const dayNumber = Math.floor(Date.now() / 86400000)
  return ((dayNumber % NIGHT_LADDERS.length) + NIGHT_LADDERS.length) % NIGHT_LADDERS.length
}

function CenterCircle({
  variant = 'pulse',
  caption,
}: {
  variant?: 'pulse' | 'breathe'
  caption?: string
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <div className={`soft-circle h-40 w-40 ${variant === 'breathe' ? 'animate-breathe' : 'animate-pulse-soft'}`} />
      {caption && <p className="mt-10 text-center text-night-soft">{caption}</p>}
    </div>
  )
}

// Fase 3 — 4-7-8 ademhaling, drie rondes.
function BreathPhase({ opts, onDone }: { opts: any; onDone: () => void }) {
  const [label, setLabel] = useState('Adem…')
  const [scale, setScale] = useState(0.85)
  const [dur, setDur] = useState(4)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const steps: { say: string; label: string; dur: number; scale: number }[] = []
    for (let r = 0; r < 3; r++) {
      steps.push({ say: 'Adem in door je neus', label: 'Adem in', dur: 4, scale: 1.18 })
      steps.push({ say: 'Houd vast', label: 'Houd vast', dur: 7, scale: 1.18 })
      steps.push({ say: 'En adem langzaam uit', label: 'Adem uit', dur: 8, scale: 0.8 })
    }
    let t = 0
    steps.forEach((step) => {
      const id = window.setTimeout(() => {
        setLabel(step.label)
        setDur(step.dur)
        setScale(step.scale)
        speak([step.say], { ...opts, volume: 0.8 })
      }, t * 1000)
      timers.current.push(id)
      t += step.dur
    })
    const doneId = window.setTimeout(() => onDone(), t * 1000 + 500)
    timers.current.push(doneId)
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id))
      stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <div
        className="soft-circle h-44 w-44"
        style={{ transform: `scale(${scale})`, transition: `transform ${dur}s ease-in-out` }}
      />
      <p className="mt-12 text-lg text-night-text">{label}</p>
    </div>
  )
}

// Fase 4 — de ladder.
function LadderPhase({
  opts,
  ladderIndex,
  onDone,
}: {
  opts: any
  ladderIndex: number
  onDone: () => void
}) {
  const [current, setCurrent] = useState(-1)
  const lines = NIGHT_LADDERS[ladderIndex]
  useEffect(() => {
    speak(lines, {
      ...opts,
      gapMs: 4000,
      startDelayMs: 600,
      onLine: (i) => setCurrent(i),
      onDone,
    })
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-8">
      <div className="mb-12 soft-circle h-28 w-28 animate-breathe" />
      <p className="min-h-[3.5rem] max-w-sm text-center text-lg leading-relaxed text-night-text transition-opacity duration-700">
        {current >= 0 ? lines[current] : ''}
      </p>
    </div>
  )
}

// Fase 5 — SATS-scène gevolgd door een zachte lus tot de slaap.
function SatsPhase({
  opts,
  scene,
  onFinish,
}: {
  opts: any
  scene: string
  onFinish: () => void
}) {
  const loopTimers = useRef<number[]>([])
  useEffect(() => {
    // De scène als één geheel, in rustige zinnen.
    const sentences = scene.split(/(?<=[.!?])\s+/).filter(Boolean)
    speak(sentences, {
      ...opts,
      gapMs: 2200,
      startDelayMs: 800,
      volume: 0.85,
      onDone: startLoop,
    })

    function startLoop() {
      // Elke 20 seconden één zin, steeds zachter, tot 20 minuten voorbij zijn.
      const total = 20 * 60 * 1000
      const interval = 20 * 1000
      const count = Math.floor(total / interval)
      for (let i = 0; i < count; i++) {
        const vol = Math.max(0.12, 0.8 - i * 0.03)
        const id = window.setTimeout(() => {
          speak([SATS_LOOP_LINE], { ...opts, volume: vol })
        }, i * interval)
        loopTimers.current.push(id)
      }
      const endId = window.setTimeout(() => {
        stopSpeaking()
        onFinish()
      }, total)
      loopTimers.current.push(endId)
    }

    return () => {
      loopTimers.current.forEach((id) => window.clearTimeout(id))
      stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <div className="soft-circle h-32 w-32 animate-breathe opacity-70" style={{ ['--breathe-dur' as any]: '12s' }} />
    </div>
  )
}
