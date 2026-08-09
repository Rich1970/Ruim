import { useState } from 'react'
import { EMOTIONAL_SCALE } from '../data/content'

// Verticale schuif met 22 treden. Bovenaan = best.
// Geeft de gekozen trede-index terug (0 = bovenaan).
export function EmotionalScale({
  onConfirm,
  dark = false,
  confirmLabel = 'Dit is waar ik sta',
}: {
  onConfirm: (index: number) => void
  dark?: boolean
  confirmLabel?: string
}) {
  const max = EMOTIONAL_SCALE.length - 1 // 21
  // Slider-waarde: max = bovenaan. index = max - value.
  const [value, setValue] = useState(Math.round(max / 2))
  const index = max - value
  const rung = EMOTIONAL_SCALE[index]

  const textMain = dark ? 'text-night-text' : 'text-ink'
  const textFaint = dark ? 'text-night-soft' : 'text-ink-faint'

  return (
    <div className="flex w-full flex-col items-center">
      <div className="flex items-stretch gap-6">
        {/* de schuif */}
        <div className="flex flex-col items-center">
          <span className={`mb-2 text-xs ${textFaint}`}>licht</span>
          <input
            type="range"
            className="scale-slider"
            min={0}
            max={max}
            step={1}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            style={{
              writingMode: 'vertical-lr',
              direction: 'rtl',
              height: '320px',
              width: '40px',
              accentColor: dark ? '#8a7a68' : '#b97250',
            }}
            aria-label="Emotionele schaal"
          />
          <span className={`mt-2 text-xs ${textFaint}`}>zwaar</span>
        </div>

        {/* de treden als markering */}
        <div className="flex flex-col justify-between py-1" style={{ height: '340px' }}>
          {EMOTIONAL_SCALE.map((r, i) => (
            <button
              key={i}
              onClick={() => setValue(max - i)}
              className={`text-left text-[11px] leading-tight transition ${
                i === index
                  ? `${textMain} font-semibold`
                  : Math.abs(i - index) <= 1
                    ? textFaint
                    : dark
                      ? 'text-night-soft/40'
                      : 'text-ink-faint/40'
              }`}
            >
              {r.label.split(' · ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-6 max-w-xs text-center text-lg ${textMain}`}>{rung.label}</div>

      <button
        onClick={() => onConfirm(index)}
        className={`mt-6 w-full max-w-xs rounded-2xl px-5 py-4 text-lg font-medium transition active:scale-[0.98] ${
          dark ? 'bg-night-glow text-night-text' : 'bg-clay-500 text-sand-50'
        }`}
      >
        {confirmLabel}
      </button>
    </div>
  )
}
