// The quiz pane: drawn by Claude Code beside the conversation (terminal, desktop Code tab,
// VS Code/Cursor extension).
//
// The status arrives through onStatus (from cli.signal). What the pane draws lives in the
// session's state, so a change redraws it. render() is pure layout: register.ts hands it the
// data and the surface's elements.
import type { Elements, RenderSurface } from 'claude-code'

import type { Question, Stats, Status } from '../../types'
import type { ClientTraits } from './client'
import { drawQuiz, keys, type PaneView } from './draw'
import type { Io } from './io'
import { getLangs, getPauseWhenDone, setLangs, setPauseWhenDone } from './config'
import { languageCounts, languageOrder, loadQuestions, loadStats, saveStats } from './quiz'
import { reportAnswer } from './telemetry'

export type { PaneView } from './draw'

// Every question in the selected banks (no others are served); set by boot, which runs again
// on every reload
let questions: Question[] = []
// The bank screen's rows: every bank with questions and its count, in the order shown (the
// selection when it opened first, then A-Z, held still while it's open); set by banks()
let shown: { lang: string; count: number }[] = []

export async function boot(io: Io, chosen: Question[]): Promise<void> {
  questions = chosen
  const saved = await loadStats(io)
  await io.set('stats', () => saved)
  // The banks changed (/biteq --lang): an unanswered question from a bank no longer selected goes
  // (open() serves one from the new banks). An answered one stays so its explanation can be read.
  const ids = new Set(chosen.map(q => q.id))
  await io.set('current', c => (c.question && c.picked === null && !ids.has(c.question.id) ? { question: null, picked: null } : c))
}

// ---------------------------------------------------------------- quiz
//
// A press arrives as its Button's key (see press() below), which names the action and the
// question it was drawn for. So a click works whichever drawing it came from, and acts only if
// that question is still on screen: a second click can't count an answer twice or skip two
// questions. The one write that redraws the pane comes first; stats are saved after.

/**
 * The next question, mixed across the selected banks: a random bank that still has unseen
 * questions, then a random unseen question in it (picking the bank first keeps a small bank from
 * being drowned out by a big one). 30% of the time it's one you missed instead, and only missed
 * ones once nothing is unseen. Null once every question has been answered and none is still
 * missed: the pane says so (finished) and offers to start over.
 */
function pick(s: Stats, cur: Question | null): Question | null {
  // the question on screen (skipped, or just missed) comes back only when it's the last one left
  const notCur = (qs: Question[]) => qs.filter(q => q.id !== cur?.id)
  const unseen = questions.filter(q => !s.seen.includes(q.id))
  const from = notCur(unseen).length ? notCur(unseen) : unseen
  const missed = questions.filter(q => s.wrong.includes(q.id))
  if (notCur(missed).length && (!from.length || Math.random() < 0.3)) return randomOf(notCur(missed))   // light spaced repetition
  if (!from.length) return missed.length ? randomOf(missed) : null
  const lang = randomOf([...new Set(from.map(q => q.lang))])
  return randomOf(from.filter(q => q.lang === lang))
}

/** Every selected question has been answered, and every missed one answered right since. */
function finished(s: Stats): boolean {
  return questions.length > 0 && questions.every(q => s.seen.includes(q.id) && !s.wrong.includes(q.id))
}

/** Move on from `from` (the question on screen), unless something already moved on. */
async function advance(io: Io, from: Question | null, s: Stats): Promise<void> {
  const q = pick(s, from)
  await io.set('current', c => (c.question?.id === from?.id ? { question: q, picked: null } : c))
}

/**
 * The stats from the store, which every Claude session shares, copied into this session's
 * state. Picking from the session's copy could serve a question answered in another session.
 */
async function freshStats(io: Io): Promise<Stats> {
  const s = await loadStats(io)
  await io.set('stats', () => s)
  return s
}

/** Next / Skip / Practice now: move on from `qid` ('' when no question was on screen). */
export async function next(io: Io, qid: string): Promise<void> {
  const c = await io.get('current')
  if ((c.question?.id ?? '') !== qid) return   // already moved on
  if (c.question !== null && (await resting(io))) {
    // Claude is done: no next question until it works again (onStatus serves it then)
    await io.set('current', now => (now.question?.id === qid ? { question: null, picked: null } : now))
    return
  }
  await advance(io, c.question, await freshStats(io))
  const now = (await io.get('current')).question
  if (now) await io.focus(keys.answer(now, 0))
}

/** Whether Next should rest instead of serving: Claude is done and the person hasn't opted out. */
async function resting(io: Io): Promise<boolean> {
  return (await io.get('status')) === 'done' && (await getPauseWhenDone(io))
}

/** "Serve next question" while resting: one question now, the setting unchanged. */
export async function serve(io: Io): Promise<void> {
  if ((await io.get('current')).question !== null) return   // already serving
  await advance(io, null, await freshStats(io))
  const now = (await io.get('current')).question
  if (now) await io.focus(keys.answer(now, 0))
}

/** "Always serve": remember to keep serving after Claude is done, and serve one now. */
export async function always(io: Io): Promise<void> {
  await setPauseWhenDone(io, false)
  await serve(io)
}

/**
 * "Start over" once every selected question is answered: forget which of them were seen (other
 * banks keep their progress) and serve one, unless Claude is done and the pane is resting.
 */
export async function restart(io: Io): Promise<void> {
  if ((await io.get('current')).question !== null) return   // already serving
  const ids = new Set(questions.map(q => q.id))
  const s = await saveStats(io, st => ({ ...st, seen: st.seen.filter(id => !ids.has(id)) }))
  await io.set('stats', () => s)
  if (await resting(io)) return
  await advance(io, null, s)
  const now = (await io.get('current')).question
  if (now) await io.focus(keys.answer(now, 0))
}

// ---------------------------------------------------------------- the bank screen
//
// z opens it at any time, over whatever is on screen; z (or Done) goes back. Each bank is a
// toggle Button whose key names the state it sets (`bank:on:cs`), so a click from an old drawing
// can't undo the one before it. Every toggle is saved at once; the last bank can't be unchecked.

/** z: show the bank screen, or leave it. */
export async function banks(io: Io): Promise<void> {
  if ((await io.get('picker')).open) return leaveBanks(io)
  const counts = await languageCounts(io)
  const langs = await getLangs(io)
  const order = languageOrder(langs, Object.keys(counts)).filter(l => counts[l])
  shown = order.map(lang => ({ lang, count: counts[lang] ?? 0 }))
  const selected = langs.filter(l => counts[l])
  await io.set('picker', () => ({ open: true, selected }))
  const first = shown[0]
  if (first) await io.focus(keys.bank(first.lang, !selected.includes(first.lang)))
}

/** Check (`on`) or uncheck a bank on the bank screen, and serve from the new selection. */
export async function setBank(io: Io, lang: string, on: boolean): Promise<void> {
  let changed = false as boolean   // set inside the write
  await io.set('picker', p => {
    if (!p.open || !shown.some(b => b.lang === lang) || p.selected.includes(lang) === on) return p
    const selected = on ? [...p.selected, lang] : p.selected.filter(l => l !== lang)
    if (!selected.length) return p   // keep at least one bank
    changed = true
    return { ...p, selected }
  })
  if (!changed) return
  // the latest selection, in case another toggle landed meanwhile
  const selected = (await io.get('picker')).selected
  await setLangs(io, selected)
  questions = await loadQuestions(io, selected)
  await io.focus(keys.bank(lang, !on))
}

/**
 * Back to the quiz. An unanswered question from a bank no longer checked is replaced (as is
 * the empty screen once every question was answered), unless Claude is done and the pane rests.
 * The question is settled under the bank screen, then one write shows it.
 */
async function leaveBanks(io: Io): Promise<void> {
  const s = await freshStats(io)
  const rest = await resting(io)
  const ids = new Set(questions.map(q => q.id))
  await io.set('current', c =>
    c.question && (c.picked !== null || ids.has(c.question.id)) ? c : { question: rest ? null : pick(s, null), picked: null })
  await io.set('picker', p => ({ ...p, open: false }))
  const { question, picked } = await io.get('current')
  if (question) await io.focus(keys.answer(question, picked ?? 0))
}

async function nextQuestion(io: Io): Promise<void> {
  await advance(io, (await io.get('current')).question, await freshStats(io))
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
      // only the first answer ever counts; one seen before one_shot existed never does
      one_shot: q.id in s.one_shot ? s.one_shot : { ...s.one_shot, [q.id]: ok && !s.seen.includes(q.id) },
      engaged_waits: s.engaged_waits + (counts ? 1 : 0),
    }
  })
  await io.set('stats', () => s)
  void reportAnswer(io)
  // With Enter-to-next (the CLI) the ring stays on the picked option, so pressing it again moves on;
  // the hint bar is kept out of the ring. Otherwise the ring moves to the Next button.
  await io.focus((await io.traits()).enterMovesOn ? keys.answer(q, idx) : keys.next(q))
}

/** This session's status changed: count a new wait, serve a question, reopen the pane. */
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
      // first click on an option is a press. The CLI keeps ctrl+x tab. A grant is
      // refused if the composer has text; boot still opens without focus.
      void io.openPane((await io.traits()).focusOnWait)
    }
  }
}

/** Open (or retitle) the pane. Returns false when the surface can't place it yet. */
export async function open(io: Io, focus: boolean): Promise<boolean> {
  await io.set('dismissed', () => false)
  const placed = await io.openPane(focus)
  // while resting (Claude done), reopening the pane keeps the resting message
  if ((await io.get('current')).question === null && questions.length && !(await resting(io))) await nextQuestion(io)
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
  if (action === 'banks') return banks(io)
  if (action === 'bank') return setBank(io, rest.slice(1).join(':'), rest[0] === 'on')
  // a click from the quiz's last drawing while the bank screen shows: the quiz isn't on screen
  if (action !== 'close' && (await io.get('picker')).open) return
  if (action === 'answer') {
    const qid = rest.slice(1).join(':')
    const c = await io.get('current')
    // Enter on an option of the question already answered is "next" (the CLI hint bar's ⏎)
    if (c.question?.id === qid && c.picked !== null && (await io.traits()).enterMovesOn) await next(io, qid)
    else await answer(io, qid, Number(rest[0]))
  }
  else if (action === 'next' || action === 'skip') await next(io, rest.join(':'))
  else if (action === 'serve') await serve(io)
  else if (action === 'restart') await restart(io)
  else if (action === 'always') await always(io)
  else if (action === 'close') await close(io)
}

// ---------------------------------------------------------------- drawing

/** Everything render() needs, read from the session's state (this subscribes the pane to it). */
export async function view(io: Io): Promise<PaneView> {
  const { question, picked } = await io.get('current')
  const status = await io.get('status')
  const stats = await io.get('stats')
  const done = question === null && finished(stats)
  const p = await io.get('picker')
  return {
    // Claude is done and Next rested: say so instead of showing a question
    resting: status === 'done' && question === null && questions.length > 0 && !done,
    finished: done,
    banks: [...new Set(questions.map(q => q.lang))].map(lang => {
      const inBank = questions.filter(q => q.lang === lang)
      return { lang, count: inBank.length, oneShot: inBank.filter(q => stats.one_shot[q.id]).length }
    }),
    picking: p.open ? shown.map(b => ({ ...b, on: p.selected.includes(b.lang) })) : null,
    bank: questions.length,
    question,
    picked,
    stats,
  }
}

/**
 * `traits`: the client's (client.ts traitsOf). `fill`: the rows of a docked pane's body; with a hint
 * bar the tree fills them so the bar sits on the pane's last row. Left out inline, where the pane
 * is sized to its content.
 */
export function render(v: PaneView, el: Elements[RenderSurface], traits: ClientTraits, fill?: number) {
  return drawQuiz(v, el, traits, () => {}, traits.hintBar ? fill : undefined)
}

function randomOf<T>(list: T[]): T | null {
  return list[Math.floor(Math.random() * list.length)] ?? null
}
