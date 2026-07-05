import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useApp } from '../state/store'
import { Segmented } from '../components/bits'
import { DISCOUNT_CARDS, CARD_COUNTRIES } from '../engine/cards'
import { IconUser } from '../components/icons'

export function Account() {
  const { t, lang, setLang, user, logout, trips, setDefaultCard } = useApp()
  if (!user) return <Navigate to="/login?next=/account" replace />

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">{t('account_title')}</h1>

      <div className="card mt-5 flex items-center gap-4 p-5">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-xl font-extrabold text-brand-700">
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="flex-1">
          <div className="text-lg font-extrabold text-ink">{user.name}</div>
          <div className="text-sm text-ink-faint">{user.email}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-brand-700">{trips.length}</div>
          <div className="text-[11px] uppercase tracking-wide text-ink-faint">{t('saved_journeys_count')}</div>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink">{t('language')}</span>
          <Segmented<'nl' | 'en'>
            value={lang}
            onChange={setLang}
            options={[{ value: 'nl', label: 'Nederlands' }, { value: 'en', label: 'English' }]}
          />
        </div>
        <div className="mt-4">
          <label className="label mb-1.5 block">{t('default_card')}</label>
          <select className="field appearance-none" value={user.card} onChange={(e) => setDefaultCard(e.target.value)}>
            <option value="none">{DISCOUNT_CARDS[0].name}</option>
            {CARD_COUNTRIES.map((c) => (
              <optgroup key={c.code} label={c.label}>
                {DISCOUNT_CARDS.filter((d) => d.id !== 'none' && d.country === c.code).map((d) => (
                  <option key={d.id} value={d.id}>{d.flag} {d.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <Link to="/kortingskaarten" className="mt-2 inline-block text-sm font-semibold text-brand-700">{t('cards_browse_all')} →</Link>
        </div>
      </div>

      <button onClick={logout} className="btn-ghost mt-4 w-full !py-3 !text-rose-600">
        <IconUser width={17} height={17} /> {t('logout')}
      </button>
    </div>
  )
}
