import type { ReactNode } from 'react'
import { useNav } from '../lib/nav'
import { stopSpeaking } from '../lib/speech'

// Basislayout voor de daglicht-schermen.
export function LightShell({
  children,
  title,
  tone = 'sand',
  onBack,
}: {
  children: ReactNode
  title?: string
  tone?: 'sand' | 'warm'
  onBack?: () => void
}) {
  const { back } = useNav()
  const bg = tone === 'warm' ? 'bg-sand-100' : 'bg-sand-50'
  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-16 pt-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => {
              stopSpeaking()
              onBack ? onBack() : back()
            }}
            className="rounded-full px-3 py-2 text-sm text-ink-faint"
          >
            ← terug
          </button>
          {title && <div className="text-sm text-ink-faint">{title}</div>}
          <div className="w-14" />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

export function Prompt({ children }: { children: ReactNode }) {
  return <p className="mb-6 text-xl leading-relaxed text-ink">{children}</p>
}

export function NextButton({ onClick, label = 'Verder' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={() => {
        stopSpeaking()
        onClick()
      }}
      className="mt-8 w-full rounded-2xl bg-clay-500 px-5 py-4 text-lg font-medium text-sand-50 transition active:scale-[0.98]"
    >
      {label}
    </button>
  )
}
