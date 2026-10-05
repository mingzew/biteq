// The quiz pane: drawn by Claude Code beside the conversation (terminal, desktop Code tab,
// VS Code/Cursor extension) instead of the Python version's separate curses window.
//
// Python's Pane polls sessions.json; here the status arrives through onStatus (from
// cli.signal). What the pane draws lives in the session's state, so a change redraws it.
// render() is pure layout like Python's render(): register.ts hands it the data, the
// surface's elements and the button actions.
import type { Elements, RenderSurface } from 'claude-code'

import type { Question, Stats, Status } from '../../types'
import type { Io } from './io'
import { loadStats, saveStats } from './quiz'

const AGENT = 'Claude'
const LETTERS = 'abcd'

// Already filtered to the chosen languages; set by boot, which runs again on every reload
let questions: Question[] = []

export async function boot(io: Io, chosen: Question[]): Promise<void> {
  questions = chosen
  const saved = await loadStats(io)
  await io.set('stats', () => saved)
}

// ---------------------------------------------------------------- quiz
//
// A press arrives as its Button's key (see press() below), which names the action and the
// question it was drawn for. So a click works whichever drawing it came from, and acts only if
// that question is still on screen: a second click can't count an answer twice or skip two
// questions. The one write that redraws the pane comes first; stats are saved after.

/** Python's next_question(): usually a random unseen one, 30% of the time one you missed. */
function pick(s: Stats, cur: Question | null): { q: Question | null; restart: boolean } {
  const pool = questions.filter(q => q.id !== cur?.id)
  const from = pool.length ? pool : questions
  const wrong = from.filter(q => s.wrong.includes(q.id))
  if (wrong.length && Math.random() < 0.3) return { q: randomOf(wrong), restart: false }   // light spaced repetition
  const unseen = from.filter(q => !s.seen.includes(q.id))
  return unseen.length ? { q: randomOf(unseen), restart: false } : { q: randomOf(from), restart: true }
}

/** Move on from `from` (the question on screen), unless something already moved on. */
async function advance(io: Io, from: Question | null, s: Stats): Promise<void> {
  const { q, restart } = pick(s, from)
  await io.set('current', c => (c.question?.id === from?.id ? { question: q, picked: null } : c))
  if (restart) {   // everything seen: start the cycle again
    const saved = await saveStats(io, st => ({ ...st, seen: [] }))
    await io.set('stats', () => saved)
  }
}

/** Next / Skip / Practice now: move on from `qid` ('' when no question was on screen). */
export async function next(io: Io, qid: string): Promise<void> {
  const c = await io.get('current')
  if ((c.question?.id ?? '') !== qid) return   // already moved on
  await advance(io, c.question, await io.get('stats'))
}

async function nextQuestion(io: Io): Promise<void> {
  await advance(io, (await io.get('current')).question, await io.get('stats'))
}

export async function answer(io: Io, qid: string, idx: number): Promise<void> {
  let recorded = null as Question | null   // set when this press records it (and not an earlier one)
  await io.set('current', c => {
    const ok = c.question?.id === qid && c.picked === null && idx < c.question.options.length
    recorded = ok ? c.question : null
    return ok ? { question: c.question, picked: idx } : c
  })
  const q = recorded
  if (!q) return
  const ok = idx === q.answer
  const status = await io.get('status')
  const counts = (status === 'thinking' || status === 'waiting') && !(await io.get('engaged'))
  if (counts) await io.set('engaged', () => true)
  const s = await saveStats(io, s => {
    const [c, n] = s.by_lang[q.lang] ?? [0, 0]
    const streak = ok ? s.streak + 1 : 0
    return {
      ...s,
      answered: s.answered + 1,
      correct: s.correct + (ok ? 1 : 0),
      streak,
      best_streak: Math.max(s.best_streak, streak),
      by_lang: { ...s.by_lang, [q.lang]: [c + (ok ? 1 : 0), n + 1] },
      seen: s.seen.includes(q.id) ? s.seen : [...s.seen, q.id],
      wrong: ok ? s.wrong.filter(id => id !== q.id) : s.wrong.includes(q.id) ? s.wrong : [...s.wrong, q.id],
      engaged_waits: s.engaged_waits + (counts ? 1 : 0),
    }
  })
  await io.set('stats', () => s)
}

/** Python's Pane.poll, for one session: count the wait, serve a question, flash. */
export async function onStatus(io: Io, was: Status, now: Status): Promise<void> {
  if (now === was) return
  if (now === 'thinking' && was !== 'waiting') {
    await io.set('engaged', () => false)
    const s = await saveStats(io, st => ({ ...st, waits: st.waits + 1 }))
    await io.set('stats', () => s)
    const c = await io.get('current')
    if (c.question === null || c.picked !== null) await advance(io, c.question, s)
    if (!(await io.get('dismissed'))) void io.openPane(false)   // no-op when already open
  } else if (now === 'waiting') {
    io.toast(`biteq: ${AGENT} needs your input`)
  } else if (now === 'done' && (was === 'thinking' || was === 'waiting')) {
    io.toast(`biteq: ${AGENT} is done, go review`)
  }
}

/** Once a second: redraw while thinking, so the timer counts (Python repaints every 250 ms). */
export async function tick(io: Io): Promise<void> {
  if ((await io.get('status')) === 'thinking') io.redraw()
}

/** Open (or retitle) the pane. Returns false when the surface can't place it yet. */
export async function open(io: Io, focus: boolean): Promise<boolean> {
  await io.set('dismissed', () => false)
  const placed = await io.openPane(focus)
  if ((await io.get('current')).question === null && questions.length) await nextQuestion(io)
  return placed
}

/** The person closed the pane: keep it closed until /biteq opens it again. */
export async function closed(io: Io): Promise<void> {
  await io.set('dismissed', () => true)
}

export async function close(io: Io): Promise<void> {
  await closed(io)
  await io.closePane()
}

// ---------------------------------------------------------------- presses

// Button keys: what a press does, and for which question
const keys = {
  answer: (q: Question, idx: number) => `answer:${idx}:${q.id}`,
  next: (q: Question | null) => `next:${q?.id ?? ''}`,
  skip: (q: Question) => `skip:${q.id}`,
  close: 'close',
}

/**
 * A press on the pane, by its Button's key (register.ts's ui.press hook).
 *
 * Every redraw gives the Buttons new handlers, and the desktop app can send a click with the
 * previous drawing's: the engine then finds no handler ("ui_press not handled") and the click
 * is lost. Acting on the key instead works for any drawing.
 */
export async function press(io: Io, key: string): Promise<void> {
  const [action = '', ...rest] = key.split(':')
  if (action === 'answer') await answer(io, rest.slice(1).join(':'), Number(rest[0]))
  else if (action === 'next' || action === 'skip') await next(io, rest.join(':'))
  else if (action === 'close') await close(io)
}

// ---------------------------------------------------------------- drawing

export type PaneView = {
  status: Status
  elapsedMs: number
  question: Question | null
  picked: number | null
  stats: Stats
}

/** Everything render() needs, read from the session's state (this subscribes the pane to it). */
export async function view(io: Io): Promise<PaneView> {
  const { question, picked } = await io.get('current')
  return {
    status: await io.get('status'),
    elapsedMs: (await io.now()) - (await io.get('since')),
    question,
    picked,
    stats: await io.get('stats'),
  }
}

export function render(v: PaneView, el: Elements[RenderSurface], surface: RenderSurface) {
  const { Box, Text, Button } = el
  const { question: q, picked: p, stats: s } = v
  // Keys reach the pane only while it has the keyboard: ctrl+x tab in the terminal. The desktop
  // app keeps the keys in the message box, so there the buttons are for clicking, without hints.
  const key = (k: string) => (surface === 'terminal' ? k : undefined)
  const handled = () => {}   // presses are taken by key in press(), before a handler is looked up
  const banner = {
    thinking: { text: `● ${AGENT} is thinking  ${fmtSecs(v.elapsedMs)}`, color: 'yellow' },
    waiting: { text: `! ${AGENT} needs your input`, color: 'magenta' },
    done: { text: `✓ ${AGENT} is done, go review`, color: 'green' },
    idle: { text: '○ idle', color: 'gray' },
  }[v.status]

  return (
    <Box flexDirection="column" gap={1}>
      <Box justifyContent="space-between">
        <Text color={banner.color} bold>{banner.text}</Text>
        <Text dimColor>streak {s.streak} · {s.correct}/{s.answered}</Text>
      </Box>

      {q === null ? (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>
            {questions.length
              ? 'No question yet. Prompt Claude and one will appear here, or practice now.'
              : 'No questions for the selected languages. Try /biteq langs.'}
          </Text>
          {questions.length > 0 && <Button key={keys.next(null)} label="Practice now" hotkey={key('n')} onPress={handled} />}
        </Box>
      ) : (
        <Box flexDirection="column" gap={1}>
          <Text>
            <Text color="blue">[{q.lang}] </Text>
            <Text bold>{q.title ?? ''}</Text>
          </Text>
          <Text>{q.prompt}</Text>
          {q.code ? <Text color="cyan">{q.code}</Text> : null}
          <Box flexDirection="column">
            {q.options.map((opt, i) => {
              const label = `${LETTERS[i]}) ${opt}`
              if (p === null) {
                return <Button key={keys.answer(q, i)} label={label} hotkey={key(LETTERS[i] ?? '')} plain onPress={handled} />
              }
              const right = i === q.answer
              const mine = i === p
              return (
                <Text key={keys.answer(q, i)} color={right ? 'green' : mine ? 'red' : undefined} dimColor={!right && !mine}>
                  {right ? '✓ ' : mine ? '✗ ' : '  '}{label}
                </Text>
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
          ? <Button key={keys.next(q)} label="Next" hotkey={key('n')} variant="primary" onPress={handled} />
          : <Button key={keys.skip(q)} label="Skip" hotkey={key('s')} onPress={handled} />)}
        <Button key={keys.close} label="Close" hotkey={key('q')} role="dismiss" dimColor onPress={handled} />
      </Box>
    </Box>
  )
}

function fmtSecs(ms: number): string {
  const secs = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
}

function randomOf<T>(list: T[]): T | null {
  return list[Math.floor(Math.random() * list.length)] ?? null
}
