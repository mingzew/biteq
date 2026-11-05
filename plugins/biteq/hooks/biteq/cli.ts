// biteq commands: /biteq [pane] [--lang a,b] | langs | check | stats | doctor | pause on|off | debug [on|off] | reset [--all] | start | stop
//
// `/biteq` alone opens the pane. `signal` is the path every status takes: register.ts hands
// engine events to claude.parse, and the status goes to store.setStatus, then pane.onStatus.
import type { Status } from '../../types'
import { getDebug, getLangs, getPauseWhenDone, setDebug, setLangs, setPauseWhenDone } from './config'
import { enabled as debugEnabled } from './debug'
import type { Io } from './io'
import { boot as bootPane, onStatus, open as openPane } from './pane'
import { languageCounts, languageOrder, loadQuestions, loadStats, validate } from './quiz'
import { CONFIG, STATS, eventsLog, setStatus } from './store'

export const COMMAND = {
  name: 'biteq',
  description: 'biteq quiz pane: /biteq [--lang a,b] | langs | check | stats | doctor | pause on|off | debug [on|off] | reset',
  argumentHint: '[pane|langs|check|stats|doctor|pause|debug|reset] [--lang a,b]',
}

/** Record a status and let the pane react (count the wait, serve a question, flash). */
export async function signal(io: Io, status: Status | null): Promise<void> {
  if (status === null) return
  const was = await setStatus(io, status)
  await onStatus(io, was, status)
}

/** Session start (and every reload): open the pane, without taking the keys. */
export async function boot(io: Io): Promise<void> {
  await cmdPane(io, undefined, false)
}

/** "/biteq ..." typed as a prompt -> its arguments, or null for any other prompt. */
export function typedArgs(text: string): string | null {
  // the desktop may wrap what was typed in <system-reminder> notes
  const typed = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim()
  const m = /^\/biteq(?:\s+([\s\S]*))?$/.exec(typed)
  return m ? (m[1] ?? '') : null
}

// ---------------------------------------------------------------- commands

async function cmdPane(io: Io, lang: string | undefined, focus: boolean): Promise<string> {
  const available = await languageCounts(io)
  let langs: string[]
  if (lang !== undefined) {
    langs = lang.split(',').map(l => l.trim()).filter(Boolean)
    const unknown = langs.filter(l => !(l in available))
    if (unknown.length) {
      return `biteq: unknown language ${unknown.join(', ')} (available: ${Object.keys(available).sort().join(', ')})`
    }
  } else {
    langs = await getLangs(io)
  }
  // Only the selected banks are served, mixed; the others never are, even once these run out
  const questions = await loadQuestions(io, langs)
  if (!questions.length) {
    const counts = Object.entries(available).sort().map(([k, v]) => `${k} ${v}`).join(', ')
    return `biteq: no questions in ${langs.join(', ')}. Counts: ${counts}. Pick others with /biteq --lang a,b.`
  }
  if (lang !== undefined) await setLangs(io, langs)   // remembered for the next session
  await bootPane(io, questions)
  const placed = await openPane(io, focus)
  if (!placed) return 'biteq: the pane will show up once this window is wide enough.'
  const how = (await io.traits()).hotkeys
    ? 'ctrl+x tab gives the pane the keyboard: a-d answer, n next, z banks, q close.'
    : 'click an answer, then Next.'
  const mix = langs.filter(l => available[l]).map(l => `${l} ${available[l]}`).join(', ')
  return `biteq: serving ${mix} (${questions.length} questions). ${how}`
}

async function cmdLangs(io: Io): Promise<string> {
  const chosen = await getLangs(io)
  const counts = await languageCounts(io)
  // the selected banks first (the only ones served), then the rest A-Z
  return languageOrder(chosen, Object.keys(counts))
    .map(lang => `${lang.padEnd(8)} ${String(counts[lang]).padStart(3)} questions${chosen.includes(lang) ? '   <- selected' : ''}`)
    .join('\n')
}

async function cmdCheck(io: Io): Promise<string> {
  const { summary, errors } = await validate(io)
  return [summary, ...errors.map(e => `ERROR ${e}`)].join('\n')
}

async function cmdStats(io: Io): Promise<string> {
  const s = await loadStats(io)
  const pct = (a: number, b: number) => (b ? `${Math.floor((100 * a) / b)}%` : 'n/a')
  const sizes = await languageCounts(io)
  // correct: every attempt, re-asks included. one-shot: of the bank, right the first time
  // (question ids start with "<lang>-")
  const oneShot = (lang: string) => Object.keys(s.one_shot).filter(id => s.one_shot[id] && id.startsWith(`${lang}-`)).length
  const langs = Object.entries(s.by_lang).sort()
  return [
    `answered      ${s.answered}  (${pct(s.correct, s.answered)} correct)`,
    `streak        ${s.streak}  (best ${s.best_streak})`,
    `AI waits      ${s.waits}  (you practiced during ${pct(s.engaged_waits, s.waits)} of them)`,
    ...(langs.length ? [`${' '.repeat(13)}${'correct'.padEnd(10)}one-shot`] : []),
    ...langs.map(([lang, [c, n]]) =>
      `  ${lang.padEnd(10)} ${`${c}/${n}`.padEnd(9)} ${sizes[lang] ? `${oneShot(lang)}/${sizes[lang]}` : '-'}`),
    `to review     ${s.wrong.length} questions you missed`,
  ].join('\n')
}

async function cmdDoctor(io: Io): Promise<string> {
  const counts = await languageCounts(io)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  let storeOk = 'writable'
  try {
    await io.storeSet('.probe', 1)
    await io.storeDelete('.probe')
  } catch {
    storeOk = 'NOT writable'
  }
  return [
    `claude code   ${await io.version()}`,
    `plugin        ${io.pluginRoot}`,
    `client        ${(await io.client()) ?? 'unsupported or none (headless)'}`,
    `store         ${storeOk}`,
    `status        ${await io.get('status')}`,
    `debug log     ${(await debugEnabled(io)) ? await eventsLog(io) : 'off (/biteq debug)'}`,
    `questions     ${total} (${Object.entries(counts).sort().map(([k, n]) => `${k} ${n}`).join(', ')})`,
    `selected      ${(await getLangs(io)).join(',')}`,
    `when done     ${(await getPauseWhenDone(io)) ? 'pause (no new question until Claude works again)' : 'keep serving'}`,
  ].join('\n')
}

async function cmdReset(io: Io, all: boolean): Promise<string> {
  const removed = ['status']
  await setStatus(io, 'idle')
  if (all) {
    await io.storeDelete(STATS)
    await io.storeDelete(CONFIG)   // userId stays: it is the machine the users total counts
    removed.push('stats', 'config')
    const log = await eventsLog(io)
    for (const path of [log, `${log}.1`]) {
      if (await io.exists(path)) {
        await io.write(path, '')   // the engine's file API can't delete: empty it
        removed.push(path.split('/').pop() ?? path)
      }
    }
    await bootPane(io, await loadQuestions(io, await getLangs(io)))
  }
  return `removed: ${removed.join(', ')}`
}

/** `/biteq debug` turns the event log on. `off` stops it. Remembered. Does not change which loads send telemetry. */
async function cmdDebug(io: Io, value: string | undefined): Promise<string> {
  if (value === undefined || value === 'on') await setDebug(io, true)
  else if (value === 'off') await setDebug(io, false)
  else return 'usage: /biteq debug [on|off]'
  return (await getDebug(io))
    ? `biteq: debug on. Recording ${await eventsLog(io)}`
    : 'biteq: debug off'
}

/** `pause on`: no new question once Claude is done (the default); `off`: keep serving. Remembered. */
async function cmdPause(io: Io, value: string | undefined): Promise<string> {
  if (value === 'on' || value === 'off') await setPauseWhenDone(io, value === 'on')
  else if (value !== undefined) return 'usage: /biteq pause on|off'
  return (await getPauseWhenDone(io))
    ? 'biteq: pause when Claude is done: on (the next question waits until Claude works again)'
    : 'biteq: pause when Claude is done: off (questions keep coming)'
}

/** /biteq <args>, from the command (terminal) or a typed prompt (desktop); returns the reply. */
export async function run(io: Io, args: string): Promise<string> {
  const words = args.trim().split(/\s+/).filter(Boolean)
  const flag = (name: string) => {
    const i = words.findIndex(w => w === name || w.startsWith(`${name}=`))
    if (i < 0) return undefined
    const w = words[i] ?? ''
    return w.includes('=') ? w.slice(w.indexOf('=') + 1) : (words[i + 1] ?? '')
  }
  const cmd = words[0]?.startsWith('--') ? 'pane' : (words[0] ?? 'pane')
  switch (cmd) {
    case 'pane': return cmdPane(io, flag('--lang'), true)
    case 'langs': return cmdLangs(io)
    case 'check': return cmdCheck(io)
    case 'stats': return cmdStats(io)
    case 'doctor': return cmdDoctor(io)
    case 'reset': return cmdReset(io, words.includes('--all'))
    case 'pause': return cmdPause(io, words[1])
    case 'debug': return cmdDebug(io, words[1])
    case 'start': await signal(io, 'thinking'); return 'biteq: marked thinking'
    case 'stop': await signal(io, 'done'); return 'biteq: marked done'
    default:
      return 'usage: /biteq [pane] [--lang a,b] | langs | check | stats | doctor | pause on|off | debug [on|off] | reset [--all] | start | stop'
  }
}
