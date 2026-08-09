import { useEffect, useState } from 'react'
import { useNav } from '../lib/nav'
import { useStore } from '../lib/store'
import { speak, stopSpeaking } from '../lib/speech'
import { LightShell } from '../components/LightShell'
import { VR_QUESTIONS, VR_CLOSE } from '../data/content'
import { todayISO } from '../lib/storage'

// Virtual Reality-proces (Abraham) — een geleide visualisatie van ~4 minuten.
export function VR() {
  const { home } = useNav()
  const { state, update } = useStore()
  const s = state.settings
  const opts = { rate: s.voiceRate, voiceName: s.voiceName, elevenLabsKey: s.elevenLabsKey }
  const [i, setI] = useState(-1) // -1 = intro, 0..n = vragen, n = slot
  const [closing, setClosing] = useState(false)

  const HOLD = 22 // seconden stilte per vraag

  useEffect(() => {
    if (i === -1) {
      speak(
        ['We gaan een plek bezoeken. Geen plek die je wilt — een plek die er al is. Adem rustig, en laat het beeld komen.'],
        { ...opts, onDone: () => setTimeout(() => setI(0), 1500) },
      )
      return () => stopSpeaking()
    }
    if (i >= 0 && i < VR_QUESTIONS.length) {
      speak([VR_QUESTIONS[i]], opts)
      const to = window.setTimeout(() => setI((x) => x + 1), HOLD * 1000)
      return () => {
        stopSpeaking()
        window.clearTimeout(to)
      }
    }
    if (i >= VR_QUESTIONS.length && !closing) {
      setClosing(true)
      speak([VR_CLOSE], opts)
      update((d) => (d.lastVR = todayISO()))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  const question = i >= 0 && i < VR_QUESTIONS.length ? VR_QUESTIONS[i] : ''

  return (
    <LightShell title="Virtual Reality-proces" onBack={home}>
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="soft-circle mb-12 h-40 w-40 animate-breathe" style={{ ['--breathe-dur' as any]: '10s' }} />
        {i === -1 && <p className="max-w-xs text-lg text-ink-soft">Laat het beeld maar komen…</p>}
        {question && <p className="max-w-xs text-2xl font-medium text-ink">{question}</p>}
        {closing && (
          <>
            <p className="max-w-xs text-xl text-ink">{VR_CLOSE}</p>
            <button onClick={home} className="mt-8 rounded-2xl bg-clay-500 px-6 py-3 font-medium text-sand-50">
              Sluiten
            </button>
          </>
        )}
        {i >= 0 && !closing && (
          <button
            onClick={() => {
              stopSpeaking()
              setI((x) => x + 1)
            }}
            className="mt-10 text-sm text-ink-faint"
          >
            volgende ›
          </button>
        )}
      </div>
    </LightShell>
  )
}
