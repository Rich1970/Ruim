import { useEffect, useState } from 'react'
import { useNav } from '../lib/nav'
import { useStore } from '../lib/store'
import { speak, stopSpeaking } from '../lib/speech'
import { LightShell, Prompt } from '../components/LightShell'
import { VoiceCapture } from '../components/VoiceCapture'
import { BELIEF_QUESTIONS, BELIEF_REWRITE } from '../data/content'
import { uid, todayISO } from '../lib/storage'

// Overtuigingen opgraven (Bashar) — vijf vragen, daarna de definitie herschrijven.
export function Beliefs() {
  const { home } = useNav()
  const { state, update } = useStore()
  const s = state.settings
  const opts = { rate: s.voiceRate, voiceName: s.voiceName, elevenLabsKey: s.elevenLabsKey }
  const [step, setStep] = useState(0) // 0..4 vragen, 5 = herschrijven, 6 = klaar
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', ''])

  useEffect(() => {
    if (step < BELIEF_QUESTIONS.length) speak([BELIEF_QUESTIONS[step]], opts)
    else if (step === BELIEF_QUESTIONS.length) speak([BELIEF_REWRITE], opts)
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function answer(t: string) {
    const next = [...answers]
    next[step] = t
    setAnswers(next)
    setStep(step + 1)
  }

  function saveDefinition(text: string) {
    update((d) => {
      d.beliefs.push({
        id: uid(),
        feeling: answers[0],
        worldBelief: answers[1],
        selfBelief: answers[2],
        origin: answers[3],
        whoWithout: answers[4],
        newDefinition: text.trim(),
        date: todayISO(),
        readUntil: Date.now() + 7 * 24 * 3600 * 1000,
      })
    })
    setStep(6)
    speak(['Bewaard. Ik lees hem je een week lang elke ochtend terug.'], opts)
  }

  return (
    <LightShell title="Overtuigingen opgraven" onBack={home}>
      {step < BELIEF_QUESTIONS.length && (
        <div>
          <div className="mb-4 flex gap-1">
            {BELIEF_QUESTIONS.map((_, n) => (
              <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-clay-400' : 'bg-sand-200'}`} />
            ))}
          </div>
          <Prompt>{BELIEF_QUESTIONS[step]}</Prompt>
          <VoiceCapture key={step} autoStart onSubmit={answer} submitLabel="Verder" rows={3} />
        </div>
      )}

      {step === BELIEF_QUESTIONS.length && (
        <div>
          <Prompt>{BELIEF_REWRITE}</Prompt>
          <p className="mb-4 text-sm text-ink-faint">Zeg hardop hoe het voortaan is. Kort mag.</p>
          <VoiceCapture autoStart onSubmit={saveDefinition} submitLabel="Bewaar mijn nieuwe definitie" rows={3} />
        </div>
      )}

      {step === 6 && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="soft-circle mb-8 h-24 w-24" />
          <p className="max-w-xs text-lg text-ink">
            Bewaard. Ik lees hem je een week lang elke ochtend terug.
          </p>
          <button onClick={home} className="mt-8 rounded-2xl bg-clay-500 px-6 py-3 font-medium text-sand-50">
            Sluiten
          </button>
        </div>
      )}
    </LightShell>
  )
}
