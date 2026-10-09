// Desktop surface module: must be self-contained. The desktop app loads this
// file alone (ui_client_module), so a value import of ./draw would fail there.
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

export type PaneView = {
  status: Status
  elapsedMs: number
  since: number
  bank: number
  question: Question | null
  picked: number | null
  stats: Stats
}

type Clock = { since: number; extra: number }
type QuizElements = Pick<Elements['terminal'], 'Box' | 'Text' | 'Button'>

let latest: PaneView | undefined

export function drawQuiz(
  v: PaneView,
  el: QuizElements,
  surface: 'terminal' | 'desktop' | 'vscode' | 'mobile',
  onPress: (key: string) => void,
) {
  const { Box, Text, Button } = el
  const { question: q, picked: p, stats: s } = v
  const key = (k: string) => (surface === 'terminal' ? k : undefined)
  const ring = surface === 'desktop' ? true as const : undefined
  const align = surface === 'desktop' ? 'flex-start' as const : undefined
  const banner = {
    thinking: { text: `● ${AGENT} is thinking  ${fmtSecs(v.elapsedMs)}`, color: 'yellow' },
    waiting: { text: `! ${AGENT} needs your input`, color: 'magenta' },
    done: { text: `✓ ${AGENT} is done, go review`, color: 'green' },
    idle: { text: '○ idle', color: 'gray' },
  }[v.status]

  return (
    <Box flexDirection="column" gap={1} alignItems={align}>
      <Box>
        <Text bold>{NAME}</Text>
        <Text dimColor> - {TAGLINE}</Text>
      </Box>
      <Box justifyContent="space-between">
        <Text color={banner.color} bold>{banner.text}</Text>
        <Text dimColor>  streak {s.streak} · best {s.best_streak}</Text>
      </Box>

      {q === null ? (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>
            {v.bank
              ? 'No question yet. Prompt Claude and one will appear here, or practice now.'
              : 'No questions for the selected languages. Try /biteq langs.'}
          </Text>
          {v.bank > 0 && <Button key={keys.next(null)} label="Practice now" hotkey={key('n')} onPress={() => onPress(keys.next(null))} />}
        </Box>
      ) : (
        <Box flexDirection="column" gap={1}>
          <Box>
            <Text color="blue">[{q.lang}] </Text>
            <Text bold>{q.hard ? (s.streak > 0 ? '[BYE STREAK] ' : '[OOF] ') : ''}{q.title ?? ''}</Text>
          </Box>
          <Text>{q.prompt}</Text>
          {q.code ? <Text color="cyan">{q.code}</Text> : null}
          <Box flexDirection="column" alignItems={align}>
            {q.options.map((opt, i) => {
              const lettered = `${LETTERS[i]}${surface === 'desktop' ? ':' : ')'} ${opt}`
              if (p === null) {
                // Terminal `plain` already paints the hotkey as "a: "; don't also prefix "a)".
                return <Button key={keys.answer(q, i)} label={surface === 'terminal' ? opt : lettered} hotkey={key(LETTERS[i] ?? '')} plain autoFocus={i === 0 ? ring : undefined} onPress={() => onPress(keys.answer(q, i))} />
              }
              const right = i === q.answer
              const mine = i === p
              const markOpt = right ? '✓ ' : mine ? '✗ ' : '  '
              return (
                <Button key={keys.answer(q, i)} label={`${markOpt}${lettered}`} plain dimColor={!right && !mine} onPress={() => onPress(keys.answer(q, i))} />
              )
            })}
          </Box>
          {p !== null && (
            <Box flexDirection="column">
              <Text color={p === q.answer ? 'green' : 'red'} bold>{p === q.answer ? 'Correct!' : 'Not quite.'}</Text>
              <Text>{q.explanation}</Text>
            </Box>
          )}
        </Box>
      )}

      <Box gap={2}>
        {q !== null && (p !== null
          ? <Button key={keys.next(q)} label="Next" hotkey={key('n')} variant="primary" autoFocus={ring} onPress={() => onPress(keys.next(q))} />
          : <Button key={keys.skip(q)} label="Skip" hotkey={key('s')} onPress={() => onPress(keys.skip(q))} />)}
        <Button key={keys.close} label="Close" hotkey={key('q')} role="dismiss" dimColor onPress={() => onPress(keys.close)} />
      </Box>
    </Box>
  )
}

const Quiz: ClientModule<PaneView, Clock> = (v, surface) => {
  latest = v
  if (surface.state === undefined) {
    surface.every(1000, () => {
      const now = latest
      if (!now) return
      const s = surface.state
      surface.setState({
        since: now.since,
        extra: s && s.since === now.since ? s.extra + 1000 : 0,
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
