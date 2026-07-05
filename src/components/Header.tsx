import React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../state/store'
import { IconTrain, IconTicket, IconUser, IconGlobe } from './icons'

export function Header() {
  const { t, lang, setLang, user } = useApp()
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <IconTrain />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">Spoorwijs</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 sm:flex">
          <TopLink to="/">{t('nav_search')}</TopLink>
          <TopLink to="/kortingskaarten">{t('nav_cards')}</TopLink>
          <TopLink to="/trips">{t('nav_trips')}</TopLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'nl' ? 'en' : 'nl')}
            className="btn-ghost !px-3 !py-2"
            title="NL / EN"
          >
            <IconGlobe width={17} height={17} />
            <span className="text-xs font-bold">{lang.toUpperCase()}</span>
          </button>
          {user ? (
            <Link to="/account" className="btn-ghost !px-3 !py-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-sm font-semibold sm:inline">{user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link to="/login" className="btn-primary !py-2">
              <IconUser width={17} height={17} /> {t('nav_login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

function TopLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-sm font-semibold transition ${
          isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-brand-50/60'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

export function BottomNav() {
  const { t, user } = useApp()
  const loc = useLocation()
  const items = [
    { to: '/', label: t('nav_search'), icon: IconTrain, match: (p: string) => p === '/' || p.startsWith('/results') || p.startsWith('/journey') },
    { to: '/trips', label: t('nav_trips'), icon: IconTicket, match: (p: string) => p.startsWith('/trips') },
    { to: user ? '/account' : '/login', label: user ? t('nav_account') : t('nav_login'), icon: IconUser, match: (p: string) => p.startsWith('/account') || p.startsWith('/login') },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur-md sm:hidden">
      <div className="mx-auto flex max-w-md">
        {items.map((it) => {
          const active = it.match(loc.pathname)
          const Icon = it.icon
          return (
            <Link key={it.to} to={it.to} className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${active ? 'text-brand-700' : 'text-ink-faint'}`}>
              <Icon width={22} height={22} />
              {it.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
