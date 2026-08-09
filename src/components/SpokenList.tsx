import { useEffect, useState } from 'react'
import { speak, stopSpeaking } from '../lib/speech'

// Leest een rijtje gedachten voor, één voor één, en toont ze zacht.
export function SpokenList({
  lines,
  opts,
  gapMs = 3500,
  dark = false,
  auto = true,
}: {
  lines: string[]
  opts: any
  gapMs?: number
  dark?: boolean
  auto?: boolean
}) {
  const [current, setCurrent] = useState(-1)
  const [playing, setPlaying] = useState(false)

  function play() {
    setPlaying(true)
    speak(lines, {
      ...opts,
      gapMs,
      startDelayMs: 400,
      onLine: (i) => setCurrent(i),
      onDone: () => setPlaying(false),
    })
  }

  useEffect(() => {
    if (auto) play()
    return () => stopSpeaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const textMain = dark ? 'text-night-text' : 'text-ink'
  const textFaint = dark ? 'text-night-soft/50' : 'text-ink-faint/60'

  return (
    <div className="w-full">
      <ul className="space-y-4">
        {lines.map((l, i) => (
          <li
            key={i}
            className={`text-lg leading-relaxed transition-all duration-500 ${
              i === current ? `${textMain} font-medium` : i < current ? textFaint : textFaint
            }`}
          >
            {l}
          </li>
        ))}
      </ul>
      <button
        onClick={() => {
          stopSpeaking()
          if (playing) setPlaying(false)
          else play()
        }}
        className={`mt-6 text-sm ${dark ? 'text-night-soft' : 'text-ink-faint'}`}
      >
        {playing ? '❚❚ pauze' : '↻ opnieuw voorlezen'}
      </button>
    </div>
  )
}
