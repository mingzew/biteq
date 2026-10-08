// The quiz pane: drawn by Claude Code beside the conversation (terminal, desktop Code tab,
// VS Code/Cursor extension) instead of the Python version's separate curses window.
//
// Python's Pane polls sessions.json; here the status arrives through onStatus (from
// cli.signal). What the pane draws lives in the session's state, so a change redraws it.
// render() is pure layout like Python's render(): register.ts hands it the data, the
// surface's elements and the button actions.
import type { Elements, RenderSurface } from 'claude-code'

import type { Question, Stats, Status } from '../../types'
import { drawQuiz, keys, type PaneView } from './draw'
import type { Io } from './io'
import { loadStats, saveStats } from './quiz'

export type { PaneView } from './draw'

// Every question, grouped by language in the order they're served (quiz.languageOrder);
// set by boot, which runs again on every reload
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

/**
 * The next question: one language at a time. The first language (in serving order) that still
 * has unseen questions is the current one; it's served until all of its questions are answered,
 * then the next language starts. Within it, Python's next_question(): usually a random unseen
 * question, 30% of the time one you missed in that language. Once every language is done, the
 * cycle restarts from the first.
 */
function pick(s: Stats, cur: Question | null): { q: Question | null; restart: boolean } {
  const langs = [...new Set(questions.map(q => q.lang))]
  const unseenIn = (lang: string) => questions.filter(q => q.lang === lang && q.id !== cur?.id && !s.seen.includes(q.id))
  let lang = langs.find(l => unseenIn(l).length)
  const restart = lang === undefined
  lang ??= langs[0]
  const inLang = questions.filter(q => q.lang === lang)
  const pool = inLang.filter(q => q.id !== cur?.id)
  const from = pool.length ? pool : inLang
  const wrong = from.filter(q => s.wrong.includes(q.id))
  if (wrong.length && Math.random() < 0.3) return { q: randomOf(wrong), restart }   // light spaced repetition
  const unseen = restart ? from : from.filter(q => !s.seen.includes(q.id))
  return { q: randomOf(unseen.length ? unseen : from), restart }
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
  const now = (await io.get('current')).question
  if (now) await io.focus(keys.answer(now, 0))
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
  await io.focus(keys.next(q))
}

/** Python's Pane.poll, for one session: count the wait, serve a question. */
export async function onStatus(io: Io, was: Status, now: Status): Promise<void> {
  if (now === was) return
  if (now === 'thinking' && was !== 'waiting') {
    await io.set('engaged', () => false)
    const s = await saveStats(io, st => ({ ...st, waits: st.waits + 1 }))
    await io.set('stats', () => s)
    const c = await io.get('current')
    if (c.question === null || c.picked !== null) await advance(io, c.question, s)
    if (!(await io.get('dismissed'))) {
      // Desktop: ask for the pane's keyboard now that the composer is empty, so the
      // first click on an option is a press. Terminal keeps ctrl+x tab. A grant is
      // refused if the composer has text; boot still opens without focus.
      void io.openPane((await io.surface()) === 'desktop')
    }
  }
}

/** Once a second: redraw while thinking, so the timer counts (Python repaints every 250 ms). */
export async function tick(io: Io): Promise<void> {
  if ((await io.surface()) === 'desktop') return   // desktop Client counts on its own frame clock
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

/** Everything render() needs, read from the session's state (this subscribes the pane to it). */
export async function view(io: Io): Promise<PaneView> {
  const { question, picked } = await io.get('current')
  const since = await io.get('since')
  return {
    status: await io.get('status'),
    since,
    elapsedMs: (await io.now()) - since,
    bank: questions.length,
    question,
    picked,
    stats: await io.get('stats'),
  }
}

export function render(v: PaneView, el: Elements[RenderSurface], surface: RenderSurface) {
  return drawQuiz(v, el, surface, () => {})
}

function randomOf<T>(list: T[]): T | null {
  return list[Math.floor(Math.random() * list.length)] ?? null
}
