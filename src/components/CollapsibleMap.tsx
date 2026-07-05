import React, { Suspense, lazy, useState } from 'react'
import { useApp } from '../state/store'
import { IconMap, IconChevronDown } from './icons'
import type { Pt, Extra } from './JourneyMap'

// Lazy: the map + baked-in country borders load only when expanded.
const JourneyMap = lazy(() => import('./JourneyMap'))

export function CollapsibleMap({ points, egressTo, accessFrom }: { points: Pt[]; egressTo?: Extra; accessFrom?: Extra }) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-brand-50/50" aria-expanded={open}>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600"><IconMap width={17} height={17} /></span>
        <span className="font-bold text-ink">{t('map_title')}</span>
        <span className="ml-auto text-sm font-semibold text-brand-700">{open ? t('map_hide') : t('map_show')}</span>
        <IconChevronDown width={18} height={18} className={`text-brand-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-black/5 p-3">
          <Suspense fallback={<div className="grid h-[300px] w-full place-items-center rounded-xl bg-brand-50/40 text-sm text-ink-faint sm:h-[380px]">Kaart laden…</div>}>
            <JourneyMap points={points} egressTo={egressTo} accessFrom={accessFrom} />
          </Suspense>
          <div className="mt-1.5 px-1 text-[11px] text-ink-faint">{t('map_hint')}</div>
        </div>
      )}
    </div>
  )
}
