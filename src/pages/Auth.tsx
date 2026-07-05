import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useApp } from '../state/store'
import { IconTrain, IconArrowRight } from '../components/icons'

export function Auth() {
  const { t, login, register } = useApp()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/trips'
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = mode === 'login' ? login(email, pass) : register(name, email, pass)
    if (res.ok) nav(next)
    else setError(res.error ?? 'err_fields')
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10">
      <div className="mb-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-sm"><IconTrain /></span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">{mode === 'login' ? t('login_title') : t('register_title')}</h1>
        <p className="mt-1 text-sm text-ink-faint">{t('tagline')}</p>
      </div>

      <form onSubmit={submit} className="card space-y-3 p-5">
        {mode === 'register' && (
          <div>
            <label className="label mb-1 block">{t('name')}</label>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Richard" autoComplete="name" />
          </div>
        )}
        <div>
          <label className="label mb-1 block">{t('email')}</label>
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jij@voorbeeld.nl" autoComplete="email" />
        </div>
        <div>
          <label className="label mb-1 block">{t('password')}</label>
          <input className="field" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </div>
        {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{t(error as any)}</div>}
        <button type="submit" className="btn-primary w-full !py-3">
          {mode === 'login' ? t('login_btn') : t('register_btn')} <IconArrowRight width={18} height={18} />
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
        className="mt-4 text-center text-sm font-semibold text-brand-700"
      >
        {mode === 'login' ? t('to_register') : t('to_login')}
      </button>
      <Link to="/" className="mt-2 text-center text-sm text-ink-faint">← Terug naar zoeken</Link>
    </div>
  )
}
