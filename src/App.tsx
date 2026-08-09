import { NavProvider, useNav } from './lib/nav'
import { Home } from './screens/Home'
import { Night } from './screens/Night'
import { Morning } from './screens/Morning'
import { Evening } from './screens/Evening'
import { Urgent } from './screens/Urgent'
import { Play } from './screens/Play'
import { Abundance } from './screens/Abundance'
import { Facts } from './screens/Facts'
import { Settings } from './screens/Settings'
import { VR } from './screens/VR'
import { Beliefs } from './screens/Beliefs'

function Router() {
  const { screen } = useNav()
  switch (screen) {
    case 'night':
      return <Night />
    case 'morning':
      return <Morning />
    case 'evening':
      return <Evening />
    case 'urgent':
      return <Urgent />
    case 'play':
      return <Play />
    case 'abundance':
      return <Abundance />
    case 'facts':
      return <Facts />
    case 'settings':
      return <Settings />
    case 'vr':
      return <VR />
    case 'beliefs':
      return <Beliefs />
    case 'home':
    default:
      return <Home />
  }
}

export default function App() {
  return (
    <NavProvider>
      <div className="min-h-full">
        <Router />
      </div>
    </NavProvider>
  )
}
