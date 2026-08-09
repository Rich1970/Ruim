import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export type Screen =
  | 'home'
  | 'night'
  | 'morning'
  | 'evening'
  | 'urgent'
  | 'play'
  | 'abundance'
  | 'facts'
  | 'settings'
  | 'vr'
  | 'beliefs'

interface NavState {
  screen: Screen
  go: (s: Screen) => void
  back: () => void
  home: () => void
  canBack: boolean
}

const Ctx = createContext<NavState | null>(null)

export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Screen[]>(['home'])

  const go = useCallback((s: Screen) => setStack((st) => [...st, s]), [])
  const back = useCallback(
    () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)),
    [],
  )
  const home = useCallback(() => setStack(['home']), [])

  const screen = stack[stack.length - 1]
  return (
    <Ctx.Provider value={{ screen, go, back, home, canBack: stack.length > 1 }}>
      {children}
    </Ctx.Provider>
  )
}

export function useNav(): NavState {
  const c = useContext(Ctx)
  if (!c) throw new Error('useNav buiten NavProvider')
  return c
}
