import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { loadState, saveState, type RuimState } from './storage'
import { setSpeechDefaults } from './speech'

interface StoreContext {
  state: RuimState
  update: (fn: (draft: RuimState) => void) => void
  replace: (next: RuimState) => void
}

const Ctx = createContext<StoreContext | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RuimState>(() => loadState())
  const saveTimer = useRef<number | null>(null)

  // Debounced opslaan bij elke wijziging.
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => saveState(state), 150)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [state])

  // Stem-standaarden doorgeven aan de spraaklaag, zodat elke stem hetzelfde klinkt.
  useEffect(() => {
    setSpeechDefaults({
      rate: state.settings.voiceRate,
      pitch: state.settings.voicePitch,
      voiceName: state.settings.voiceName,
      elevenLabsKey: state.settings.elevenLabsKey,
    })
  }, [
    state.settings.voiceRate,
    state.settings.voicePitch,
    state.settings.voiceName,
    state.settings.elevenLabsKey,
  ])

  function update(fn: (draft: RuimState) => void) {
    setState((prev) => {
      const next: RuimState = structuredClone(prev)
      fn(next)
      return next
    })
  }

  function replace(next: RuimState) {
    setState(next)
    saveState(next)
  }

  return <Ctx.Provider value={{ state, update, replace }}>{children}</Ctx.Provider>
}

export function useStore(): StoreContext {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore buiten StoreProvider')
  return c
}
