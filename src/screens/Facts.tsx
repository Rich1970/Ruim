import { useState } from 'react'
import { useNav } from '../lib/nav'
import { useStore } from '../lib/store'
import { LightShell } from '../components/LightShell'
import { euro, percent, monthsToText, runwayMonths, freedomProgress, monthlyCostPercent } from '../lib/facts'

export function Facts() {
  const { home } = useNav()
  const { state, update } = useStore()
  const f = state.facts
  const [edit, setEdit] = useState(!f.filled)
  const [total, setTotal] = useState(String(f.total || ''))
  const [fixed, setFixed] = useState(String(f.monthlyFixed || ''))
  const [passive, setPassive] = useState(String(f.passiveIncome || ''))
  const [freedom, setFreedom] = useState(String(f.freedomNumber || ''))

  function save() {
    update((d) => {
      d.facts = {
        filled: true,
        total: Number(total) || 0,
        monthlyFixed: Number(fixed) || 0,
        passiveIncome: Number(passive) || 0,
        freedomNumber: Number(freedom) || 0,
      }
    })
    setEdit(false)
  }

  return (
    <LightShell title="Feiten" onBack={home}>
      <p className="mb-5 text-sm text-ink-faint">
        Deze cijfers vul je één keer in. Ze blijven op dit toestel en verschijnen nergens anders in de app —
        alleen hier, en alleen als je er zelf om vraagt.
      </p>

      {edit ? (
        <div className="space-y-4">
          <Field label="Totaal vermogen" value={total} onChange={setTotal} />
          <Field label="Vaste maandlasten privé" value={fixed} onChange={setFixed} />
          <Field label="Maandelijks passief inkomen" value={passive} onChange={setPassive} />
          <Field
            label="Vrijheidsgetal"
            hint="het maandelijkse passieve inkomen waarbij werken optioneel wordt"
            value={freedom}
            onChange={setFreedom}
          />
          <button onClick={save} className="w-full rounded-2xl bg-clay-500 py-4 text-lg font-medium text-sand-50">
            Bewaar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            Zonder één euro te verdienen ben je{' '}
            <strong>{monthsToText(runwayMonths(f))}</strong> gedekt.
          </Card>
          <Card>
            Je bent <strong>{percent(freedomProgress(f), 0)}</strong> op weg naar je vrijheidsgetal.
          </Card>
          <Card>
            Elke maand dat je niets doet, kost je <strong>{percent(monthlyCostPercent(f), 2)}</strong> van je totaal.
          </Card>

          <div className="rounded-2xl bg-sand-100 p-4 text-sm text-ink-soft">
            <Row k="Totaal vermogen" v={euro(f.total)} />
            <Row k="Vaste maandlasten" v={euro(f.monthlyFixed)} />
            <Row k="Passief inkomen p/m" v={euro(f.passiveIncome)} />
            <Row k="Vrijheidsgetal" v={euro(f.freedomNumber)} />
          </div>

          <button onClick={() => setEdit(true)} className="w-full rounded-2xl border border-sand-300 py-3 text-ink-soft">
            Cijfers aanpassen
          </button>
        </div>
      )}
    </LightShell>
  )
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  return (
    <label className="block">
      <span className="text-sm text-ink-soft">{label}</span>
      {hint && <span className="block text-xs text-ink-faint">{hint}</span>}
      <div className="mt-1 flex items-center rounded-2xl border border-sand-200 bg-sand-50 px-4">
        <span className="text-ink-faint">€</span>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-2 py-3 text-lg text-ink outline-none"
          placeholder="0"
        />
      </div>
    </label>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-sand-100 p-5 text-lg leading-relaxed text-ink">{children}</div>
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-1">
      <span>{k}</span>
      <span className="font-medium text-ink">{v}</span>
    </div>
  )
}
