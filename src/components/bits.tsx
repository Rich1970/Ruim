import React from 'react'
import type { OperatorInfo, JourneyTag } from '../engine/types'
import { useApp } from '../state/store'

export function OperatorBadge({ op, small }: { op: OperatorInfo; small?: boolean }) {
  return (
    <span
      className={`chip ${small ? 'text-[10px] px-2 py-0.5' : ''}`}
      style={{ backgroundColor: op.color, color: op.textColor ?? '#fff' }}
      title={op.name}
    >
      {op.short}
    </span>
  )
}

const TAG_STYLE: Record<JourneyTag, string> = {
  fastest: 'bg-blue-50 text-blue-700',
  cheapest: 'bg-emerald-50 text-emerald-700',
  fewest: 'bg-violet-50 text-violet-700',
  night: 'bg-indigo-900 text-indigo-100',
  direct: 'bg-amber-50 text-amber-700',
}

export function Tag({ tag }: { tag: JourneyTag }) {
  const { t } = useApp()
  const key = `tag_${tag}` as const
  return <span className={`chip ${TAG_STYLE[tag]}`}>{t(key as any)}</span>
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Segmented<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-xl bg-brand-50 p-1 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            value === o.value ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-faint hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
