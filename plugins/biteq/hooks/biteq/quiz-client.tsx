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

import type { Question, Stats } from '../../types'
import type { ClientTraits } from './client'

const AGENT = 'Claude'
const NAME = 'BiteQ'
const TITLE_COLOR = '#F58700'
const TAGLINE = 'Bite Size Coding Questions'
const LETTERS = 'abcd'
const RESTING = `${AGENT} is done, go review. The next time ${AGENT} cooks, we will serve the question.`
const BANKS = 'Choose the banks to practise. They are served mixed, and saved as you go.'
const CONGRATS = 'Congratulations!'
const FINISHED = "You've cleared every question in your banks:"
const ONE_SHOT = (n: number, of: number) => `${n} of ${of} in one shot.`
// how to go on, in the client's own terms: its hotkeys where it has them, its buttons where it doesn't
const AGAIN = (hotkeys: boolean) => (hotkeys
  ? 'Press n to start over, or z to choose other banks.'
  : 'Click Start over to go again, or Banks to choose other banks.')
// the remembered banks have no questions (one was removed or emptied): the bank screen fixes it
const EMPTY = (hotkeys: boolean) => (hotkeys
  ? 'No questions in the selected banks. Press z to choose other banks.'
  : 'No questions in the selected banks. Click Banks to choose other banks.')

export const keys = {
  answer: (q: Question, idx: number) => `answer:${idx}:${q.id}`,
  next: (q: Question | null) => `next:${q?.id ?? ''}`,
  skip: (q: Question) => `skip:${q.id}`,
  close: 'close',
  serve: 'serve',     // while resting: one question now
  always: 'always',   // while resting: keep serving after Claude is done, remembered
  restart: 'restart', // every selected question answered: serve them again
  banks: 'banks',     // z: open the bank screen, or go back to the quiz
  bank: (lang: string, on: boolean) => `bank:${on ? 'on' : 'off'}:${lang}`,   // check/uncheck a bank
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
  if (v.picking) {
    const row = [<Text key="toggle" dimColor>⏎ toggle</Text>, hint(keys.banks, 'done', 'z'), hint(keys.close, 'close', 'q')]
    return row.flatMap((item, i) => (i === 0 ? [item] : [<Text key={`sep-${i}`} dimColor> · </Text>, item]))
  }
  const items =
    q === null && v.finished ? [hint(keys.restart, 'start over', 'n')]
    : q === null && v.resting ? [hint(keys.serve, 'serve next', 'n'), hint(keys.always, 'always serve', 's')]
    : q === null ? (v.bank > 0 ? [hint(keys.next(null), 'practice', 'n')] : [])
    : v.picked === null ? [hint(keys.skip(q), 'skip', 'n')]
    : [<Text key="enter" dimColor>⏎ next</Text>]
  const hidden = q !== null && v.picked !== null && (
    <Box key="hidden-next" position="absolute" width={0} height={0} overflow="hidden">
      {hint(keys.next(q), 'next', 'n')}
    </Box>
  )
  const row = [...items, hint(keys.banks, 'banks', 'z'), hint(keys.close, 'close', 'q')]
  return [
    ...row.flatMap((item, i) => (i === 0 ? [item] : [<Text key={`sep-${i}`} dimColor> · </Text>, item])),
    ...(hidden ? [hidden] : []),
  ]
}

/** The pane keys the terminal's hint bar presses: never in the arrow keys' focus ring. */
export function isHintKey(key: string): boolean {
  return key === keys.close || key === keys.serve || key === keys.always || key === keys.restart || key === keys.banks || key.startsWith('next:') || key.startsWith('skip:')
}

export type PaneView = {
  resting: boolean   // Claude is done and Next rested: no question until Claude works again
  finished: boolean   // every question in the selected banks is answered: offer to start over
  // the selected banks that have questions; oneShot: how many were right the first time
  banks: { lang: string; count: number; oneShot: number }[]
  picking: { lang: string; count: number; on: boolean }[] | null   // the bank screen's rows, while it shows
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

type QuizElements = Pick<Elements['terminal'], 'Box' | 'Text' | 'Button'>

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
      <Box justifyContent="space-between">
        <Text color={banner.color} bold dimColor={dim}>{banner.text}</Text>
        <Box>
          <Text dimColor>  </Text>
          <Text {...mark(s.streak, s.best_streak)}>streak {s.streak}</Text>
          <Text dimColor> · </Text>
          <Text {...mark(s.best_streak, s.streak)}>best {s.best_streak}</Text>
        </Box>
      </Box>

      {v.picking ? (
        <Box flexDirection="column" gap={1} alignItems={align}>
          <Text dimColor={dim}>{BANKS}</Text>
          <Box flexDirection="column" alignItems={align}>
            {v.picking.map((b, i) => (
              // keyed by the state a press sets, so the key changes with each toggle
              <Button key={keys.bank(b.lang, !b.on)} label={`${b.on ? '[x]' : '[ ]'} ${b.lang.padEnd(8)} ${String(b.count).padStart(3)}`}
                hotkey={key(i < 9 ? String(i + 1) : '')} plain dimColor={dim} autoFocus={i === 0 ? ring : undefined}
                onPress={() => onPress(keys.bank(b.lang, !b.on))} />
            ))}
          </Box>
        </Box>
      ) : q === null && v.finished ? (
        <Box flexDirection="column" gap={1} alignItems={align}>
          <Box>
            <Text bold color={TITLE_COLOR} dimColor={dim}>{CONGRATS}</Text>
            {/* the total only with several banks: with one it would repeat that bank's line */}
            {v.banks.length > 1 && (
              <Text dimColor={dim}> {ONE_SHOT(v.banks.reduce((a, b) => a + b.oneShot, 0), v.banks.reduce((a, b) => a + b.count, 0))}</Text>
            )}
          </Box>
          <Box flexDirection="column">
            <Text dimColor={dim}>{FINISHED}</Text>
            {v.banks.map(b => (
              // a perfect bank is marked like a record streak
              <Text key={`done:${b.lang}`} {...(b.oneShot === b.count ? { bold: true as const, color: TITLE_COLOR } : {})} dimColor={dim}>
                {`  ✓ ${b.lang.padEnd(8)} one-shot ${String(b.oneShot).padStart(3)}/${b.count}`}
              </Text>
            ))}
          </Box>
          <Text dimColor={dim}>{AGAIN(traits.hotkeys)}</Text>
          {!hints && action(keys.restart, 'Start over', { primary: true, focus: ring })}
        </Box>
      ) : q === null && v.resting ? (
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
              : EMPTY(traits.hotkeys)}
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
          {v.picking && action(keys.banks, 'Done', { primary: true, hotkey: 'z' })}
          {!v.picking && q !== null && (p !== null
            ? action(keys.next(q), 'Next', { primary: true, hotkey: 'n', focus: ring })
            : action(keys.skip(q), 'Skip', { hotkey: 's' }))}
          {!v.picking && action(keys.banks, 'Banks', { hotkey: 'z' })}
          {action(keys.close, 'Close', { hotkey: 'q', dismiss: true })}
        </Box>
      )}
    </Box>
  )
}

const Quiz: ClientModule<QuizProps> = (v, surface) =>
  drawQuiz(v, surface.elements, v.traits, key => surface.post({ key }))

export default Quiz
