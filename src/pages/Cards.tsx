import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/store'
import { DISCOUNT_CARDS, CARD_COUNTRIES, resaleOf, type DiscountCard, type Resale } from '../engine/cards'
import { OPERATORS } from '../engine/data'
import { CardCheckoutModal } from '../components/CardCheckoutModal'
import { IconX, IconArrowRight, IconTicket, IconCheck } from '../components/icons'

function ResaleBadge({ id }: { id: string }) {
  const { t } = useApp()
  const r = resaleOf(id)
  const style: Record<Resale, string> = {
    spoorwijs: 'bg-emerald-50 text-emerald-700',
    partner: 'bg-amber-50 text-amber-700',
    operator: 'bg-brand-50 text-ink-faint',
  }
  const dot: Record<Resale, string> = { spoorwijs: 'bg-emerald-500', partner: 'bg-amber-500', operator: 'bg-gray-300' }
  const key = r === 'spoorwijs' ? 'resale_spoorwijs' : r === 'partner' ? 'resale_partner' : 'resale_operator'
  return <span className={`chip ${style[r]}`}><span className={`h-1.5 w-1.5 rounded-full ${dot[r]}`} />{t(key as any)}</span>
}

export function Cards() {
  const { t } = useApp()
  const [selected, setSelected] = useState<DiscountCard | null>(null)
  const cards = DISCOUNT_CARDS.filter((c) => c.id !== 'none')

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">{t('cards_title')}</h1>
      <p className="mt-1.5 max-w-2xl text-ink-soft">{t('cards_intro')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{t('resale_legend')}:</span>
        <ResaleBadge id="interrail" /><ResaleBadge id="sncf_avantage" /><ResaleBadge id="db_bahncard25" />
      </div>

      {CARD_COUNTRIES.map((country) => {
        const group = cards.filter((c) => c.country === country.code)
        if (group.length === 0) return null
        return (
          <section key={country.code} className="mt-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-faint">{group[0].flag} {country.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((c) => (
                <button key={c.id} onClick={() => setSelected(c)} className="card group flex flex-col p-4 text-left transition hover:shadow-lift hover:-translate-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.flag}</span>
                    <span className="font-bold text-ink">{c.name}</span>
                    {c.discountPct > 0 && <span className="chip ml-auto bg-emerald-50 text-emerald-700">−{Math.round(c.discountPct * 100)}%</span>}
                    {c.reservationsOnly && <span className="chip ml-auto bg-brand-50 text-brand-700">pas</span>}
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{c.blurb}</p>
                  <div className="mt-2 flex-1"><ResaleBadge id={c.id} /></div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">{c.priceLabel}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">{t('card_moreinfo')} <IconArrowRight width={15} height={15} className="transition group-hover:translate-x-0.5" /></span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )
      })}

      {selected && <CardModal card={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function CardModal({ card, onClose }: { card: DiscountCard; onClose: () => void }) {
  const { t, user, setDefaultCard } = useApp()
  const nav = useNavigate()
  const [saved, setSaved] = useState(false)
  const [buying, setBuying] = useState(false)
  const resale = resaleOf(card.id)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  const covers = card.operatorIds.map((id) => OPERATORS[id]?.name).filter(Boolean)

  function use() {
    if (user) { setDefaultCard(card.id); setSaved(true) }
    else nav('/login?next=/kortingskaarten')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-lift sm:rounded-3xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={card.name}>
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-black/5 bg-white/95 px-4 py-3 backdrop-blur">
          <span className="text-2xl">{card.flag}</span>
          <span className="font-extrabold text-ink">{card.name}</span>
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-ink-faint hover:bg-brand-50" aria-label={t('close')}><IconX width={18} height={18} /></button>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-wrap gap-1.5">
            <ResaleBadge id={card.id} />
            {card.discountPct > 0 && <span className="chip bg-emerald-50 text-emerald-700">−{Math.round(card.discountPct * 100)}% {t('card_discount_word')}</span>}
            <span className="chip bg-brand-50 text-brand-700">{card.issuer}</span>
          </div>

          <p className="text-ink-soft">{card.blurb}</p>

          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 text-sm">
            <Info label={t('card_price')} value={card.priceLabel} />
            {card.eligibility && <Info label={t('card_eligibility')} value={card.eligibility} />}
            {covers.length > 0 && <div className="col-span-2"><Info label={t('card_covers')} value={covers.join(', ')} /></div>}
          </dl>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{t('card_via_us')}</div>

          <div className="grid gap-2">
            {resale === 'spoorwijs'
              ? <button onClick={() => setBuying(true)} className="btn-primary w-full !py-3"><IconTicket width={18} height={18} /> {t('card_buy_via_us')}</button>
              : <a href={card.orderUrl} target="_blank" rel="noopener" className="btn-primary w-full !py-3"><IconTicket width={18} height={18} /> {resale === 'partner' ? t('card_order_partner') : t('card_order', { issuer: card.issuer || 'de vervoerder' })} ↗</a>}
            <div className="grid grid-cols-2 gap-2">
              <a href={card.infoUrl} target="_blank" rel="noopener" className="btn-ghost !py-2.5">{t('card_moreinfo')} ↗</a>
              <button onClick={use} className="btn-subtle !py-2.5">{saved ? <><IconCheck width={16} height={16} /> {t('card_saved_default')}</> : t('card_use')}</button>
            </div>
          </div>
        </div>
      </div>
      {buying && <CardCheckoutModal card={card} onClose={() => setBuying(false)} />}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  )
}
