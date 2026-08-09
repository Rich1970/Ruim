import { useEffect, useState } from 'react'
import { useNav } from '../lib/nav'
import { useStore } from '../lib/store'
import { speak, stopSpeaking } from '../lib/speech'
import { LightShell, Prompt, NextButton } from '../components/LightShell'
import { EmotionalScale } from '../components/EmotionalScale'
import { SpokenList } from '../components/SpokenList'
import { VoiceCapture } from '../components/VoiceCapture'
import { URGENT_OPENING, URGENT_RULE, higherThoughts } from '../data/content'
import { amountImpact, euro, percent } from '../lib/facts'
import { uid, next9am } from '../lib/storage'

type Step = 'open' | 'scale' | 'thoughts' | 'choice' | 'amount' | 'park' | 'done'

export function Urgent() {
  const { home } = useNav()
  const { state, update } = useStore()
  const [step, setStep] = useState<Step>('open')
  const [idx, setIdx] = useState(12)
  const [amount, setAmount] = useState('')
  const s = state.settings
  const opts = { rate: s.voiceRate, voiceName: s.voiceName, elevenLabsKey: s.elevenLabsKey }

  useEffect(() => {
    if (step === 'open') {
      speak([URGENT_OPENING], { ...opts, onDone: () => setStep('scale') })
    }
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function parkIt(text: string) {
    update((d) => {
      d.items.push({
        id: uid(),
        text: text.trim() || 'Dit moment',
        source: 'urgent',
        createdAt: Date.now(),
        dueAt: next9am(),
        respondAfter: Date.now() + 24 * 3600 * 1000,
        resolved: false,
        wasSmaller: null,
      })
      d.nightWorriesTotal += 1
    })
    setStep('done')
  }

  const impact = amountImpact(state.facts, Number(amount) || 0)

  return (
    <LightShell title="Nu even niet oké" tone="warm" onBack={home}>
      {step === 'open' && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="soft-circle mb-8 h-24 w-24 animate-pulse-soft" />
          <p className="text-2xl font-medium text-ink">{URGENT_OPENING}</p>
        </div>
      )}

      {step === 'scale' && (
        <div className="flex flex-col items-center">
          <Prompt>Waar sta je nu?</Prompt>
          <EmotionalScale
            confirmLabel="Dit is het"
            onConfirm={(i) => {
              setIdx(i)
              setStep('thoughts')
            }}
          />
        </div>
      )}

      {step === 'thoughts' && (
        <div>
          <Prompt>Drie gedachten die net iets lichter liggen.</Prompt>
          <SpokenList lines={higherThoughts(idx).slice(0, 3)} opts={opts} />
          <NextButton onClick={() => setStep('choice')} />
        </div>
      )}

      {step === 'choice' && (
        <div>
          <Prompt>Wil je zien hoe groot dit werkelijk is?</Prompt>
          <div className="space-y-3">
            {state.facts.filled ? (
              <button
                onClick={() => setStep('amount')}
                className="w-full rounded-2xl bg-clay-500 px-5 py-4 text-lg text-sand-50"
              >
                Ja, laat de verhouding zien
              </button>
            ) : (
              <p className="rounded-2xl bg-sand-100 p-4 text-sm text-ink-faint">
                Vul eerst je cijfers in bij Feiten om de verhouding te kunnen zien.
              </p>
            )}
            <button
              onClick={() => setStep('park')}
              className="w-full rounded-2xl border border-sand-300 px-5 py-4 text-lg text-ink-soft"
            >
              Nee, laat maar even
            </button>
          </div>
        </div>
      )}

      {step === 'amount' && (
        <div>
          <Prompt>Om welk bedrag gaat het?</Prompt>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="bijv. 2500"
              className="flex-1 rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-xl text-ink outline-none"
              autoFocus
            />
            <button onClick={() => amount && setStep('park')} className="rounded-2xl bg-clay-500 px-5 text-sand-50">
              Toon
            </button>
          </div>
          {amount && Number(amount) > 0 && (
            <div className="mt-6 rounded-2xl bg-sand-100 p-5 leading-relaxed text-ink">
              <p>
                Dit is <span className="font-semibold">{percent(impact.pctOfTotal, 1)}</span> van wat je hebt.
              </p>
              <p className="mt-2">
                Je runway gaat hierdoor van <span className="font-semibold">{impact.beforeText}</span> naar{' '}
                <span className="font-semibold">{impact.afterText}</span>.
              </p>
            </div>
          )}
          <NextButton onClick={() => setStep('park')} label="Oké, ik heb het gezien" />
        </div>
      )}

      {step === 'park' && (
        <div>
          <Prompt>Reageren mag pas over 24 uur. Zet het van je af.</Prompt>
          <p className="mb-4 text-ink-soft">Waar gaat het over? Ik zet het op de lijst van morgen negen uur.</p>
          <VoiceCapture onSubmit={parkIt} submitLabel="Op de lijst van morgen" rows={2} />
          <button onClick={() => parkIt('')} className="mt-4 w-full text-sm text-ink-faint">
            sla over
          </button>
        </div>
      )}

      {step === 'done' && <UrgentDone opts={opts} onClose={home} />}
    </LightShell>
  )
}

function UrgentDone({ opts, onClose }: { opts: any; onClose: () => void }) {
  useEffect(() => {
    speak([URGENT_RULE], opts)
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="soft-circle mb-8 h-24 w-24" />
      <p className="max-w-xs text-lg text-ink">{URGENT_RULE}</p>
      <NextButton onClick={onClose} label="Sluiten" />
    </div>
  )
}
