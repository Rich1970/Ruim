import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/store'
import { SearchForm } from '../components/SearchForm'
import { queryToParams, todayIso, addDaysIso } from '../engine/searchParams'
import { STATION_MAP, stationToPlace } from '../engine/data'
import type { Place } from '../engine/types'
import { IconTrain, IconArrowRight, IconClock, IconBell } from '../components/icons'

const AMS = stationToPlace(STATION_MAP['amsterdam'])
const sp = (id: string) => stationToPlace(STATION_MAP[id])

const POPULAR: { to: Place; label: string; emoji: string; note: string }[] = [
  { to: sp('naples'), label: 'Amsterdam → Napels', emoji: '🇮🇹', note: 'via Zwitserland & Rome' },
  { to: sp('london'), label: 'Amsterdam → Londen', emoji: '🇬🇧', note: 'Eurostar direct' },
  { to: sp('paris'), label: 'Amsterdam → Parijs', emoji: '🇫🇷', note: 'Eurostar 3u20' },
  { to: { id: 'positano', name: 'Positano', lat: 40.6287, lon: 14.4855, isStation: false, country: 'IT', region: 'Campania, Italië' }, label: 'Amsterdam → Positano', emoji: '🏖️', note: 'trein + auto (dorp zonder station)' },
  { to: sp('barcelona'), label: 'Amsterdam → Barcelona', emoji: '🇪🇸', note: 'via Parijs & Montpellier' },
  { to: sp('vienna'), label: 'Amsterdam → Wenen', emoji: '🇦🇹', note: 'Nachttrein mogelijk' },
]

export function Home() {
  const { t } = useApp()
  const nav = useNavigate()

  function go(to: Place) {
    nav(`/results?${queryToParams({ from: AMS, to, date: addDaysIso(todayIso(), 30), timePref: 480, passengers: 1, card: 'none', minTransfer: 0 }).toString()}`)
  }

  return (
    <div className="pb-8">
      <section className="mx-auto max-w-6xl px-4 pt-8 sm:pt-12">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div className="animate-slide-up">
            <span className="chip bg-brand-100 text-brand-700">🚆 EU + UK · NS · Eurostar · TGV · DB · Trenitalia</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              {t('hero_h1a')}<br />
              <span className="text-brand-600">{t('hero_h1b')}</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-ink-soft">{t('hero_intro')}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-ink-soft">
              <Feature icon={<IconTrain width={16} height={16} />}>{t('feat_cities')}</Feature>
              <Feature icon={<IconClock width={16} height={16} />}>{t('feat_cheap')}</Feature>
              <Feature icon={<IconBell width={16} height={16} />}>{t('feat_alerts')}</Feature>
            </div>
          </div>
          <div className="animate-fade-in">
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-faint">{t('popular')}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR.map((p) => (
            <button key={p.label} onClick={() => go(p.to)} className="card group flex items-center gap-3 p-4 text-left transition hover:shadow-lift hover:-translate-y-0.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-xl">{p.emoji}</span>
              <span className="flex-1">
                <span className="block font-bold text-ink">{p.label}</span>
                <span className="block text-sm text-ink-faint">{p.note}</span>
              </span>
              <IconArrowRight width={18} height={18} className="text-brand-500 transition group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">{t('why_title')}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Why n="1" t={t('why1_t')} b={t('why1_b')} />
          <Why n="2" t={t('why2_t')} b={t('why2_b')} />
          <Why n="3" t={t('why3_t')} b={t('why3_b')} />
        </div>
      </section>
    </div>
  )
}

function Feature({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold shadow-sm">{icon}{children}</span>
}

function Why({ n, t, b }: { n: string; t: string; b: string }) {
  return (
    <div className="card p-5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 font-extrabold text-white">{n}</div>
      <h3 className="mt-3 font-bold text-ink">{t}</h3>
      <p className="mt-1.5 text-sm text-ink-soft">{b}</p>
    </div>
  )
}
