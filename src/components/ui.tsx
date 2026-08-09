import { useEffect, type ReactNode } from 'react'
import { stopSpeaking } from '../lib/speech'

// Zachte cirkel — het beeldmerk dat door de hele app terugkomt.
export function SoftCircle({
  size = 180,
  variant = 'still',
  durationSec,
}: {
  size?: number
  variant?: 'still' | 'breathe' | 'pulse'
  durationSec?: number
}) {
  const anim =
    variant === 'breathe' ? 'animate-breathe' : variant === 'pulse' ? 'animate-pulse-soft' : ''
  return (
    <div
      className={`soft-circle ${anim}`}
      style={{
        width: size,
        height: size,
        ...(durationSec ? ({ ['--breathe-dur' as any]: `${durationSec}s` } as any) : {}),
      }}
    />
  )
}

// Volledig scherm dat de stem stopt bij een tik (voor geleide flows).
export function TapToStop({
  children,
  onTap,
  className = '',
}: {
  children: ReactNode
  onTap?: () => void
  className?: string
}) {
  return (
    <div
      className={className}
      onClick={() => {
        stopSpeaking()
        onTap?.()
      }}
    >
      {children}
    </div>
  )
}

// Grote, rustige knop.
export function BigButton({
  onClick,
  children,
  tone = 'sand',
}: {
  onClick: () => void
  children: ReactNode
  tone?: 'sand' | 'clay' | 'moss' | 'dark'
}) {
  const tones: Record<string, string> = {
    sand: 'bg-sand-100 text-ink border-sand-200',
    clay: 'bg-clay-500 text-sand-50 border-clay-600',
    moss: 'bg-moss-500 text-sand-50 border-moss-600',
    dark: 'bg-night-glow text-night-text border-night-soft',
  }
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-3xl border px-6 py-6 text-left text-lg font-medium shadow-sm transition active:scale-[0.98] ${tones[tone]}`}
    >
      {children}
    </button>
  )
}

// Secundaire, zachte knop.
export function SoftButton({
  onClick,
  children,
  full = false,
  dark = false,
}: {
  onClick: () => void
  children: ReactNode
  full?: boolean
  dark?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`${full ? 'w-full ' : ''}rounded-2xl border px-5 py-3 text-base font-medium transition active:scale-[0.98] ${
        dark
          ? 'border-night-soft/50 bg-transparent text-night-text'
          : 'border-sand-200 bg-sand-50 text-ink-soft'
      }`}
    >
      {children}
    </button>
  )
}

// Zorgt dat de stem stopt zodra een scherm verdwijnt.
export function useStopOnUnmount() {
  useEffect(() => {
    return () => stopSpeaking()
  }, [])
}

// Kop boven een geleid scherm.
export function FlowHeader({ title, onBack, dark = false }: { title?: string; onBack: () => void; dark?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5">
      <button
        onClick={onBack}
        className={`rounded-full px-4 py-2 text-sm ${dark ? 'text-night-soft' : 'text-ink-faint'}`}
      >
        ← terug
      </button>
      {title && (
        <div className={`text-sm ${dark ? 'text-night-soft' : 'text-ink-faint'}`}>{title}</div>
      )}
      <div className="w-16" />
    </div>
  )
}
