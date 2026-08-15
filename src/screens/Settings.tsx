import { useEffect, useRef, useState } from 'react'
import { useNav } from '../lib/nav'
import { useStore } from '../lib/store'
import { speak, stopSpeaking, dutchVoices } from '../lib/speech'
import { LightShell } from '../components/LightShell'
import { exportBackup, importBackup } from '../lib/storage'

const SAMPLE = 'Zo klink ik. Rustig, en in jouw tempo. Je kunt hier op je gemak tegen me praten.'

// Eén rij in de stemkiezer: kiezen + beluisteren.
function VoiceRow({
  active,
  label,
  onPick,
  onPreview,
}: {
  active: boolean
  label: string
  onPick: () => void
  onPreview: () => void
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${
        active ? 'border-clay-500 bg-sand-100' : 'border-sand-200 bg-sand-50'
      }`}
    >
      <button onClick={onPick} className="flex flex-1 items-center gap-2 text-left text-sm text-ink">
        <span
          className={`inline-block h-4 w-4 shrink-0 rounded-full border ${
            active ? 'border-clay-500 bg-clay-500' : 'border-sand-300'
          }`}
        />
        {label}
      </button>
      <button
        onClick={onPreview}
        className="rounded-full border border-sand-300 px-3 py-1 text-sm text-ink-soft"
        aria-label="Beluister deze stem"
      >
        ▶
      </button>
    </div>
  )
}

export function Settings() {
  const { home, go } = useNav()
  const { state, update, replace } = useStore()
  const s = state.settings
  const [voices, setVoices] = useState<{ name: string; lang: string }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState('')

  useEffect(() => {
    dutchVoices().then((vs) => setVoices(vs.map((v) => ({ name: v.name, lang: v.lang }))))
  }, [])

  function setScene(i: number) {
    update((d) => {
      d.settings.satsSceneIndex = i
    })
  }
  function editScene(i: number, text: string) {
    update((d) => {
      d.settings.satsScenes[i] = text
    })
  }

  async function onImport(file: File) {
    try {
      const next = await importBackup(file)
      replace(next)
      setImportMsg('Back-up teruggezet.')
    } catch {
      setImportMsg('Dit bestand kon niet worden gelezen.')
    }
  }

  return (
    <LightShell title="Instellingen" onBack={home}>
      <div className="space-y-8 pb-10">
        {/* SATS-scènes */}
        <section>
          <h2 className="mb-2 text-lg font-medium text-ink">Je slaapscène</h2>
          <p className="mb-3 text-sm text-ink-faint">
            Kies de scène die je hoort vlak voor de slaap. Je mag hem zelf herschrijven.
          </p>
          <div className="space-y-3">
            {s.satsScenes.map((scene, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-3 ${
                  s.satsSceneIndex === i ? 'border-clay-500 bg-sand-100' : 'border-sand-200 bg-sand-50'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <button
                    onClick={() => setScene(i)}
                    className={`rounded-full px-3 py-1 text-sm ${
                      s.satsSceneIndex === i ? 'bg-clay-500 text-sand-50' : 'text-ink-soft'
                    }`}
                  >
                    {s.satsSceneIndex === i ? '● actief' : 'kies deze'}
                  </button>
                  <button onClick={() => speak([scene], { rate: s.voiceRate, voiceName: s.voiceName, elevenLabsKey: s.elevenLabsKey })} className="text-sm text-ink-faint">
                    ▶ beluister
                  </button>
                </div>
                <textarea
                  value={scene}
                  onChange={(e) => editScene(i, e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm text-ink outline-none"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Stem */}
        <section>
          <h2 className="mb-2 text-lg font-medium text-ink">Stem</h2>
          <label className="block text-sm text-ink-soft">
            Snelheid: {s.voiceRate.toFixed(2)}
            <input
              type="range"
              min={0.6}
              max={1.1}
              step={0.05}
              value={s.voiceRate}
              onChange={(e) => update((d) => (d.settings.voiceRate = Number(e.target.value)))}
              className="mt-1 w-full"
              style={{ accentColor: '#b97250' }}
            />
          </label>

          <label className="mt-3 block text-sm text-ink-soft">
            Warmte (toonhoogte): {s.voicePitch.toFixed(2)}
            <input
              type="range"
              min={0.8}
              max={1.2}
              step={0.02}
              value={s.voicePitch}
              onChange={(e) => update((d) => (d.settings.voicePitch = Number(e.target.value)))}
              className="mt-1 w-full"
              style={{ accentColor: '#b97250' }}
            />
          </label>

          <button
            onClick={() =>
              speak([SAMPLE], { rate: s.voiceRate, pitch: s.voicePitch, voiceName: s.voiceName, elevenLabsKey: s.elevenLabsKey })
            }
            className="mt-3 rounded-2xl border border-sand-300 px-4 py-2 text-sm text-ink-soft"
          >
            ▶ test de stem
          </button>

          {voices.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-ink-soft">Kies de stem die het prettigst klinkt:</p>
              <div className="space-y-2">
                <VoiceRow
                  active={s.voiceName === ''}
                  label="Automatisch (beste stem van je toestel)"
                  onPick={() => update((d) => (d.settings.voiceName = ''))}
                  onPreview={() => speak([SAMPLE], { rate: s.voiceRate, pitch: s.voicePitch, voiceName: '', elevenLabsKey: '' })}
                />
                {voices.map((v) => (
                  <VoiceRow
                    key={v.name}
                    active={s.voiceName === v.name}
                    label={v.name}
                    onPick={() => update((d) => (d.settings.voiceName = v.name))}
                    onPreview={() => speak([SAMPLE], { rate: s.voiceRate, pitch: s.voicePitch, voiceName: v.name, elevenLabsKey: '' })}
                  />
                ))}
              </div>
            </div>
          )}
          {voices.length === 0 && (
            <p className="mt-3 text-xs text-ink-faint">
              Nog geen Nederlandse stem gevonden op dit toestel. Zie de tip hieronder om er één in te stellen;
              tot die tijd gebruikt de app de standaardstem van je telefoon.
            </p>
          )}

          <div className="mt-4 rounded-2xl bg-sand-100 p-4 text-sm text-ink-soft">
            <p className="mb-1 font-medium text-ink">Een mooiere stem op je Android/Samsung</p>
            <p>
              De standaard-telefoonstem klinkt vaak wat vlak. Stel eenmalig een warmere
              Nederlandse stem in, dan kiest de app die vanzelf:
            </p>
            <p className="mt-2">
              <em>Instellingen</em> → <em>Algemeen beheer</em> → <em>Tekst-naar-spraak</em> → kies de{' '}
              <em>Google tekst-naar-spraak-engine</em> → tik op het tandwiel → <em>Taal/stem</em> →
              installeer een Nederlandse stem. Open Ruim daarna in <em>Chrome</em>, kom hier terug en
              kies ’m hierboven (of laat op “automatisch”).
            </p>
            <p className="mt-2">
              Tip: open de app in <em>Chrome</em> — daar werkt de stem én het inspreken het best.
            </p>
            <p className="mt-2">
              Wil je een écht warme, menselijke stem (geen robotklank)? Vul hieronder een
              <strong> ElevenLabs</strong>-sleutel in. Maak gratis een account op elevenlabs.io, ga naar je
              profiel → <em>API key</em>, kopieer die en plak ’m hier. Er is een gratis tegoed per maand;
              is dat op, dan valt de app vanzelf terug op de telefoonstem.
            </p>
          </div>

          <label className="mt-4 block text-sm text-ink-soft">
            ElevenLabs API-key (optioneel — voor de mooiste stem)
            <input
              type="password"
              value={s.elevenLabsKey}
              onChange={(e) => update((d) => (d.settings.elevenLabsKey = e.target.value))}
              placeholder="laat leeg voor de telefoonstem"
              className="mt-1 w-full rounded-2xl border border-sand-200 bg-sand-50 px-4 py-3 text-ink outline-none"
            />
          </label>
        </section>

        {/* Wallet-bedrag */}
        <section>
          <h2 className="mb-2 text-lg font-medium text-ink">Wallet Process</h2>
          <label className="block text-sm text-ink-soft">
            Bedrag dat je echt op zak hebt
            <div className="mt-1 flex items-center rounded-2xl border border-sand-200 bg-sand-50 px-4">
              <span className="text-ink-faint">€</span>
              <input
                type="number"
                inputMode="decimal"
                value={state.wallet.amount || ''}
                onChange={(e) => update((d) => (d.wallet.amount = Number(e.target.value) || 0))}
                placeholder="bijv. 500"
                className="w-full bg-transparent px-2 py-3 text-lg text-ink outline-none"
              />
            </div>
          </label>
        </section>

        {/* Extra oefeningen */}
        <section>
          <h2 className="mb-2 text-lg font-medium text-ink">Oefeningen</h2>
          <div className="space-y-2">
            <button onClick={() => go('vr')} className="w-full rounded-2xl border border-sand-200 bg-sand-50 px-4 py-4 text-left text-ink">
              🌅 Virtual Reality-proces <span className="block text-sm text-ink-faint">een scène bezoeken (wekelijks)</span>
            </button>
            <button onClick={() => go('beliefs')} className="w-full rounded-2xl border border-sand-200 bg-sand-50 px-4 py-4 text-left text-ink">
              🔎 Overtuigingen opgraven <span className="block text-sm text-ink-faint">een oude definitie herschrijven</span>
            </button>
          </div>
        </section>

        {/* Back-up */}
        <section>
          <h2 className="mb-2 text-lg font-medium text-ink">Je gegevens</h2>
          <p className="mb-3 text-sm text-ink-faint">
            Alles blijft op dit toestel. Maak af en toe een back-up, dan raak je nooit iets kwijt.
          </p>
          <div className="flex gap-3">
            <button onClick={() => exportBackup(state)} className="flex-1 rounded-2xl bg-clay-500 py-3 font-medium text-sand-50">
              Exporteer back-up
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex-1 rounded-2xl border border-sand-300 py-3 text-ink-soft">
              Zet back-up terug
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImport(file)
              e.target.value = ''
            }}
          />
          {importMsg && <p className="mt-2 text-sm text-moss-600">{importMsg}</p>}
        </section>

        <p className="pt-2 text-center text-xs text-ink-faint">
          Ruim · alles blijft op je toestel · geen account, geen cloud
        </p>
      </div>
    </LightShell>
  )
}
