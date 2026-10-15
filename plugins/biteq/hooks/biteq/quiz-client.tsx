// Desktop surface module: must be self-contained. The desktop app loads this
// file alone (ui_client_module), so a value import of ./draw would fail there.
// Type imports are fine (they're erased): what differs per client arrives as a ClientTraits
// value (client.ts), from pane.render or, here, in the module's props.
//
// drawQuiz also draws the CLI pane (through pane.render, not this module): there Next/Skip
// and Close are a hint bar at the bottom, pressed by hotkey (n, q) and kept out of the arrow
// keys' focus ring (register.ts's ui.focus hook). A terminal Client would take raw keys such as
// space, but only after a mouse click; ctrl+x tab doesn't give it the keyboard.
// No setState/post during the draw call: three setStates with nothing between
// unmount the instance, and a desktop webview treats that as a crash.
import type { ClientModule, Elements } from 'claude-code'

import type { Question, Stats, Status } from '../../types'
import type { ClientTraits } from './client'

const AGENT = 'Claude'
const NAME = 'BiteQ'
const TITLE_COLOR = '#F58700'
const TAGLINE = 'Bite Size Coding Questions'
const LETTERS = 'abcd'
const RESTING = `${AGENT} is done, go review. The next time ${AGENT} cooks, we will serve the question.`

export const keys = {
  answer: (q: Question, idx: number) => `answer:${idx}:${q.id}`,
  next: (q: Question | null) => `next:${q?.id ?? ''}`,
  skip: (q: Question) => `skip:${q.id}`,
  close: 'close',
  serve: 'serve',     // while resting: one question now
  always: 'always',   // while resting: keep serving after Claude is done, remembered
}

/**
 * The terminal's hint bar for what's on screen, as one flat row: `plain` hotkey buttons draw as
 * "n: skip", with " · " between them. After an answer it shows "⏎ next" (Enter on the answered
 * option); n still moves on through a button clipped out of sight.
 */
function hintBar(v: PaneView, el: QuizElements, onPress: (key: string) => void) {
  const { Box, Text, Button } = el
  const q = v.question
  const hint = (k: string, label: string, hotkey: string) =>
    <Button key={k} label={label} hotkey={hotkey} plain dimColor onPress={() => onPress(k)} />
  const items =
    q === null && v.resting ? [hint(keys.serve, 'serve next', 'n'), hint(keys.always, 'always serve', 's')]
    : q === null ? (v.bank > 0 ? [hint(keys.next(null), 'practice', 'n')] : [])
    : v.picked === null ? [hint(keys.skip(q), 'skip', 'n')]
    : [<Text key="enter" dimColor>⏎ next</Text>]
  const hidden = q !== null && v.picked !== null && (
    <Box key="hidden-next" position="absolute" width={0} height={0} overflow="hidden">
      {hint(keys.next(q), 'next', 'n')}
    </Box>
  )
  const row = [...items, hint(keys.close, 'close', 'q')]
  return [
    ...row.flatMap((item, i) => (i === 0 ? [item] : [<Text key={`sep-${i}`} dimColor> · </Text>, item])),
    ...(hidden ? [hidden] : []),
  ]
}

/** The pane keys the terminal's hint bar presses: never in the arrow keys' focus ring. */
export function isHintKey(key: string): boolean {
  return key === keys.close || key === keys.serve || key === keys.always || key.startsWith('next:') || key.startsWith('skip:')
}

export type PaneView = {
  status: Status
  resting: boolean   // Claude is done and Next rested: no question until Claude works again
  elapsedMs: number
  since: number
  bank: number
  question: Question | null
  picked: number | null
  stats: Stats
  // Only for clients that dim when unfocused (the CLI). Desktop is not given this: restyling that
  // pane on focus unmounts the button that holds the keyboard.
  focused?: boolean
}

/** What this module draws from: the quiz, plus the traits of the client it draws for. */
type QuizProps = PaneView & { traits: ClientTraits }

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
  traits: ClientTraits,   // what differs for the client drawing it (client.ts)
  onPress: (key: string) => void,
  fill?: number,   // rows to fill (a docked pane's body), so the hint bar sits on the last row
) {
  const { Box, Text, Button } = el
  const { question: q, picked: p, stats: s } = v
  const hints = traits.hintBar
  const key = (k: string) => (traits.hotkeys ? k : undefined)
  const ring = traits.autoFocus ? true as const : undefined
  const align = traits.alignStart ? 'flex-start' as const : undefined
  const dim = traits.dimsWhenUnfocused && v.focused === false ? true as const : undefined
  // An action button (Next, Skip, Close, Serve next question, ...). Where a bare Button draws as
  // plain text it gets a rounded frame that lights in the accent colour on hover; the main
  // action's frame is accent-coloured already. The CLI keeps its own look.
  const action = (k: string, label: string, opts: { primary?: boolean; hotkey?: string; dismiss?: boolean; focus?: true } = {}) => {
    const button = (
      <Button key={k} label={label} hotkey={key(opts.hotkey ?? '')} dimColor={opts.dismiss ? true : dim}
        variant={opts.primary ? 'primary' : undefined} role={opts.dismiss ? 'dismiss' : undefined}
        autoFocus={opts.focus} onPress={() => onPress(k)} />
    )
    if (!traits.framedActions) return button
    return (
      <Box key={`frame:${k}`} borderStyle="round" borderColor={opts.primary ? 'claude' : 'subtle'} paddingX={1}
        hover={{ borderColor: 'claude' }}>
        {button}
      </Box>
    )
  }
  const banner = {
    thinking: { text: `● ${AGENT} is thinking  ${fmtSecs(v.elapsedMs)}`, color: 'yellow' },
    waiting: { text: `! ${AGENT} needs your input`, color: 'magenta' },
    done: { text: `✓ ${AGENT} is done, go review`, color: 'green' },
    idle: { text: '○ idle', color: 'gray' },
  }[v.status]
  // The high side uses the BiteQ colour, bold, and dims only while the pane is unfocused. At 0–0 the line stays dim.
  // A correct answer raises best to match streak, so the two are equal while the user is on their record.
  const mark = (n: number, other: number) =>
    n > 0 && n >= other ? { bold: true as const, color: TITLE_COLOR, dimColor: dim } : { dimColor: true as const }

  return (
    <Box flexDirection="column" gap={1} alignItems={align} flexGrow={hints ? 1 : undefined} minHeight={fill}>
      {traits.showsTitle && (
        <Box>
          <Text bold color={TITLE_COLOR} dimColor={dim}>{NAME}</Text>
          <Text dimColor> - {TAGLINE}</Text>
        </Box>
      )}
      <Box justifyContent="flex-start">
        <Text {...mark(s.streak, s.best_streak)}>streak {s.streak}</Text>
        <Text dimColor> · </Text>
        <Text {...mark(s.best_streak, s.streak)}>best {s.best_streak}</Text>
      </Box>

      {q === null && v.resting ? (
        <Box flexDirection="column" gap={1} alignItems={align}>
          <Text>{RESTING}</Text>
          {!hints && (
            <Box gap={2}>
              {action(keys.serve, 'Serve next question', { primary: true, focus: ring })}
              {action(keys.always, 'Always serve, even when Claude is done')}
            </Box>
          )}
        </Box>
      ) : q === null ? (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>
            {v.bank
              ? 'No question yet. Prompt Claude and one will appear here, or practice now.'
              : 'No questions for the selected languages. Try /biteq langs.'}
          </Text>
          {v.bank > 0 && !hints && action(keys.next(null), 'Practice now', { hotkey: 'n' })}
        </Box>
      ) : (
        <Box flexDirection="column" gap={1}>
          <Box flexWrap="wrap">
            <Text color="blue" dimColor={dim}>[{q.lang}] </Text>
            <Text dimColor={dim}>{q.prompt}</Text>
          </Box>
          {q.code ? <Text color="cyan" dimColor={dim}>{q.code}</Text> : null}
          <Box flexDirection="column" alignItems={align}>
            {q.options.map((opt, i) => {
              const lettered = `${LETTERS[i]}${traits.optionSeparator} ${opt}`
              if (p === null) {
                // A `plain` Button with a hotkey already paints it as "a: "; don't also prefix "a)".
                return <Button key={keys.answer(q, i)} label={traits.hotkeys ? opt : lettered} hotkey={key(LETTERS[i] ?? '')} plain dimColor={dim} autoFocus={i === 0 ? ring : undefined} onPress={() => onPress(keys.answer(q, i))} />
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
          <Box flexWrap="nowrap">{hintBar(v, el, onPress)}</Box>
        </Box>
      ) : (
        <Box gap={2}>
          {q !== null && (p !== null
            ? action(keys.next(q), 'Next', { primary: true, hotkey: 'n', focus: ring })
            : action(keys.skip(q), 'Skip', { hotkey: 's' }))}
          {action(keys.close, 'Close', { hotkey: 'q', dismiss: true })}
        </Box>
      )}
    </Box>
  )
}

const Quiz: ClientModule<QuizProps, Clock> = (v, surface) => {
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
  return drawQuiz({ ...v, elapsedMs }, surface.elements, v.traits, key => surface.post({ key }))
}

export default Quiz

function fmtSecs(ms: number): string {
  const secs = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
}
