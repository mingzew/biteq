// Desktop surface module: draws the quiz in the pane's webview so clicks and the
// thinking timer stay on the drawing thread. A plugin round-trip (ui.press, tick
// invalidate) remounts that webview and the next click only focuses it again.
import type { ClientModule } from 'claude-code'

import { drawQuiz, type PaneView } from './draw'

type Clock = { since: number; extra: number }

const Quiz: ClientModule<PaneView, Clock> = (v, surface) => {
  if (surface.state === undefined) {
    surface.post({ key: 'debug:mount', build: 'client-2' })
    surface.every(1000, () => {
      const s = surface.state
      if (s) surface.setState({ ...s, extra: s.extra + 1000 })
    })
    surface.setState({ since: v.since, extra: 0 })
  } else if (surface.state.since !== v.since) {
    surface.setState({ since: v.since, extra: 0 })
  }
  const extra = surface.state?.since === v.since ? surface.state.extra : 0
  const elapsedMs = v.status === 'thinking' ? Math.max(v.elapsedMs, extra) : v.elapsedMs
  return drawQuiz({ ...v, elapsedMs }, surface.elements, 'desktop', key => surface.post({ key }))
}

export default Quiz
