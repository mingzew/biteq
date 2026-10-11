// Desktop surface module: must be self-contained. The desktop app loads this
// file alone (ui_client_module), so a value import of ./draw would fail there.
//
// drawQuiz also draws the terminal pane (through pane.render, not this module): there Next/Skip
// and Close are a hint bar at the bottom, pressed by hotkey (n, q) and kept out of the arrow
// keys' focus ring (register.ts's ui.focus hook). A terminal Client would take raw keys such as
// space, but only after a mouse click; ctrl+x tab doesn't give it the keyboard.
// No setState/post during the draw call: three setStates with nothing between
// unmount the instance, and a desktop webview treats that as a crash.
import type { ClientModule, Elements } from 'claude-code'

import type { Question, Stats, Status } from '../../types'

const AGENT = 'Claude'
const NAME = 'BiteQ'
const TAGLINE = 'Bite Size Coding Questions'
const LETTERS = 'abcd'

export const keys = {
  answer: (q: Question, idx: number) => `answer:${idx}:${q.id}`,
  next: (q: Question | null) => `next:${q?.id ?? ''}`,
  skip: (q: Question) => `skip:${q.id}`,
  close: 'close',
}

/** The pane keys the terminal's hint bar presses: never in the arrow keys' focus ring. */
export function isHintKey(key: string): boolean {
  return key === keys.close || key.startsWith('next:') || key.startsWith('skip:')
}

export type PaneView = {
  status: Status
  elapsedMs: number
  since: number
  bank: number
  question: Question | null
  picked: number | null
  stats: Stats
  // Terminal only. Desktop is not given this: restyling that pane on focus
  // unmounts the button that holds the keyboard.
  focused?: boolean
}

type Clock = { since: number; extra: number }
type QuizElements = Pick<Elements['terminal'], 'Box' | 'Text' | 'Button'>

let latest: PaneView | undefined
// Instances whose timer is running. `state` stays undefined until the first tick, so an
// instance drawn twice before then (new props on a prompt) would start a second timer and the
// clock would run at double speed.
const started = new WeakSet<object>()

export function drawQuiz(
  v: PaneView,
  el: QuizElements,
  surface: 'terminal' | 'desktop' | 'vscode' | 'mobile',
  onPress: (key: string) => void,
  hints = false,   // terminal: Next/Skip and Close as a hint bar at the bottom, pressed by hotkey
  fill?: number,   // rows to fill (a docked terminal pane's body), so the hint bar sits on the last row
) {
  const { Box, Text, Button } = el
  const { question: q, picked: p, stats: s } = v
  const key = (k: string) => (surface === 'terminal' ? k : undefined)
  const ring = surface === 'desktop' ? true as const : undefined
  const align = surface === 'desktop' ? 'flex-start' as const : undefined
  const dim = surface === 'terminal' && v.focused === false ? true as const : undefined
  const banner = {
    thinking: { text: `● ${AGENT} is thinking  ${fmtSecs(v.elapsedMs)}`, color: 'yellow' },
    waiting: { text: `! ${AGENT} needs your input`, color: 'magenta' },
    done: { text: `✓ ${AGENT} is done, go review`, color: 'green' },
    idle: { text: '○ idle', color: 'gray' },
  }[v.status]

  return (
    <Box flexDirection="column" gap={1} alignItems={align} flexGrow={hints ? 1 : undefined} minHeight={fill}>
      {surface !== 'desktop' && (
        <Box>
          <Text bold dimColor={dim}>{NAME}</Text>
          <Text dimColor> - {TAGLINE}</Text>
        </Box>
      )}
      <Box justifyContent="space-between">
        <Text color={banner.color} bold dimColor={dim}>{banner.text}</Text>
        <Text dimColor>  streak {s.streak} · best {s.best_streak}</Text>
      </Box>

      {q === null ? (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>
            {v.bank
              ? 'No question yet. Prompt Claude and one will appear here, or practice now.'
              : 'No questions for the selected languages. Try /biteq langs.'}
          </Text>
          {v.bank > 0 && !hints && <Button key={keys.next(null)} label="Practice now" hotkey={key('n')} dimColor={dim} onPress={() => onPress(keys.next(null))} />}
        </Box>
      ) : (
        <Box flexDirection="column" gap={1}>
          <Box>
            <Text color="blue" dimColor={dim}>[{q.lang}] </Text>
            <Text bold dimColor={dim}>{q.hard ? (s.streak > 0 ? '[BYE STREAK] ' : '[OOF] ') : ''}{q.title ?? ''}</Text>
          </Box>
          <Text dimColor={dim}>{q.prompt}</Text>
          {q.code ? <Text color="cyan" dimColor={dim}>{q.code}</Text> : null}
          <Box flexDirection="column" alignItems={align}>
            {q.options.map((opt, i) => {
              const lettered = `${LETTERS[i]}${surface === 'desktop' ? ':' : ')'} ${opt}`
              if (p === null) {
                // Terminal `plain` already paints the hotkey as "a: "; don't also prefix "a)".
                return <Button key={keys.answer(q, i)} label={surface === 'terminal' ? opt : lettered} hotkey={key(LETTERS[i] ?? '')} plain dimColor={dim} autoFocus={i === 0 ? ring : undefined} onPress={() => onPress(keys.answer(q, i))} />
              }
              const right = i === q.answer
              const mine = i === p
              const markOpt = right ? '✓ ' : mine ? '✗ ' : '  '
              return (
                <Button key={keys.answer(q, i)} label={`${markOpt}${lettered}`} plain dimColor={dim || (!right && !mine)} onPress={() => onPress(keys.answer(q, i))} />
              )
            })}
          </Box>
          {p !== null && (
            <Box flexDirection="column">
              <Text color={p === q.answer ? 'green' : 'red'} bold dimColor={dim}>{p === q.answer ? 'Correct!' : 'Not quite.'}</Text>
              <Text dimColor={dim}>{q.explanation}</Text>
            </Box>
          )}
        </Box>
      )}

      {hints ? (
        // A unix-style hint bar: `plain` hotkey buttons draw as "n: next", dim like the rest
        // a growing column pushes the bar's one row to the pane's bottom edge
        <Box flexDirection="column" flexGrow={1} justifyContent="flex-end">
          <Box>
          {q === null
            ? v.bank > 0 && <Button key={keys.next(null)} label="practice" hotkey="n" plain dimColor={dim} onPress={() => onPress(keys.next(null))} />
            : p !== null
              ? <>
                  {/* "⏎ next" is shown; n still moves on through a button clipped out of sight */}
                  <Text dimColor>⏎ next</Text>
                  <Box position="absolute" width={0} height={0} overflow="hidden">
                    <Button key={keys.next(q)} label="next" hotkey="n" plain dimColor={dim} onPress={() => onPress(keys.next(q))} />
                  </Box>
                </>
              : <Button key={keys.skip(q)} label="skip" hotkey="n" plain dimColor={dim} onPress={() => onPress(keys.skip(q))} />}
          {(q !== null || v.bank > 0) && <Text dimColor> · </Text>}
          <Button key={keys.close} label="close" hotkey="q" plain dimColor onPress={() => onPress(keys.close)} />
          </Box>
        </Box>
      ) : (
        <Box gap={2}>
          {q !== null && (p !== null
            ? <Button key={keys.next(q)} label="Next" hotkey={key('n')} dimColor={dim} variant="primary" autoFocus={ring} onPress={() => onPress(keys.next(q))} />
            : <Button key={keys.skip(q)} label="Skip" hotkey={key('s')} dimColor={dim} onPress={() => onPress(keys.skip(q))} />)}
          <Button key={keys.close} label="Close" hotkey={key('q')} role="dismiss" dimColor onPress={() => onPress(keys.close)} />
        </Box>
      )}
    </Box>
  )
}

const Quiz: ClientModule<PaneView, Clock> = (v, surface) => {
  latest = v
  if (!started.has(surface)) {
    started.add(surface)
    surface.every(1000, () => {
      const now = latest
      if (!now) return
      const s = surface.state
      surface.setState({
        since: now.since,
        // count on from the last tick, or from the elapsed time the plugin last drew
        extra: (s && s.since === now.since ? s.extra : now.elapsedMs) + 1000,
      })
    })
  }
  const extra = surface.state?.since === v.since ? surface.state.extra : 0
  const elapsedMs = v.status === 'thinking' ? Math.max(v.elapsedMs, extra) : v.elapsedMs
  return drawQuiz({ ...v, elapsedMs }, surface.elements, 'desktop', key => surface.post({ key }))
}

export default Quiz

function fmtSecs(ms: number): string {
  const secs = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
}
