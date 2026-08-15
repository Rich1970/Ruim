import { useEffect, useRef, useState } from 'react'
import { listen, recognitionSupported, type ListenHandle } from '../lib/speech'

// Spraak in, met tekst als altijd-aanwezige terugval.
export function VoiceCapture({
  onSubmit,
  submitLabel = 'Klaar',
  placeholder = 'Zeg het hardop, of tik het in…',
  dark = false,
  initial = '',
  autoStart = false,
  rows = 3,
}: {
  onSubmit: (text: string) => void
  submitLabel?: string
  placeholder?: string
  dark?: boolean
  initial?: string
  autoStart?: boolean
  rows?: number
}) {
  const [text, setText] = useState(initial)
  const [listening, setListening] = useState(false)
  const handleRef = useRef<ListenHandle | null>(null)
  const baseRef = useRef('') // tekst vóór deze dicteersessie
  const supported = recognitionSupported()

  function start() {
    if (!supported) return
    baseRef.current = text ? text + ' ' : ''
    const h = listen(
      {
        onResult: (t) => setText((baseRef.current + t).trimStart()),
        onEnd: () => setListening(false),
        onError: () => setListening(false),
      },
      { silenceMs: 9000 }, // blijft aan; stopt pas na ~9s stilte of een tik
    )
    if (h) {
      handleRef.current = h
      setListening(true)
    }
  }

  function stop() {
    handleRef.current?.stop()
    handleRef.current = null
    setListening(false)
  }

  useEffect(() => {
    if (autoStart && supported) start()
    return () => handleRef.current?.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const inputCls = dark
    ? 'bg-transparent border-night-soft/40 text-night-text placeholder:text-night-soft/60'
    : 'bg-sand-50 border-sand-200 text-ink placeholder:text-ink-faint'

  return (
    <div className="w-full space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full resize-none rounded-2xl border px-4 py-3 text-lg leading-relaxed outline-none ${inputCls}`}
      />
      <div className="flex items-center gap-3">
        {supported && (
          <button
            onClick={listening ? stop : start}
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-2xl transition active:scale-95 ${
              listening
                ? 'border-clay-500 bg-clay-500 text-sand-50 animate-pulse'
                : dark
                  ? 'border-night-soft/50 text-night-text'
                  : 'border-sand-300 bg-sand-50 text-ink-soft'
            }`}
            aria-label={listening ? 'Stop met opnemen' : 'Spreek in'}
          >
            {listening ? '■' : '🎤'}
          </button>
        )}
        <button
          onClick={() => {
            stop()
            onSubmit(text.trim())
          }}
          className={`flex-1 rounded-2xl px-5 py-4 text-lg font-medium transition active:scale-[0.98] ${
            dark ? 'bg-night-glow text-night-text' : 'bg-clay-500 text-sand-50'
          }`}
        >
          {submitLabel}
        </button>
      </div>
      {listening ? (
        <p className={`text-center text-sm ${dark ? 'text-night-soft' : 'text-ink-faint'}`}>
          Ik luister… neem rustig de tijd. Tik op ■ als je klaar bent.
        </p>
      ) : (
        supported && (
          <p className={`text-center text-sm ${dark ? 'text-night-soft/70' : 'text-ink-faint/70'}`}>
            Tik op 🎤 en spreek op je gemak. De microfoon blijft aan.
          </p>
        )
      )}
    </div>
  )
}
