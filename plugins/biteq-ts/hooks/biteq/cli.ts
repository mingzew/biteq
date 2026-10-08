// biteq commands: /biteq [pane] [--lang a,b] | langs | check | stats | doctor | reset [--all] | start | stop
//
// Same subcommands as the Python CLI. `/biteq` alone opens the pane (Python: bare `biteq`).
// `hook` has no equivalent: register.ts hands engine events to claude.parse directly.
// `signal` is the path every status takes (Python: hook_main -> store.set_status, then the
// pane's poll).
import type { Status } from '../../types'
import { getLangs, setLangs } from './config'
import { enabled as debugEnabled } from './debug'
import type { Io } from './io'
import { boot as bootPane, onStatus, open as openPane } from './pane'
import { languageCounts, loadQuestions, loadStats, validate } from './quiz'
import { CONFIG, STATS, eventsLog, setStatus } from './store'

export const COMMAND = {
  name: 'biteq',
  description: 'biteq quiz pane: /biteq [--lang a,b] | langs | check | stats | doctor | reset',
  argumentHint: '[pane|langs|check|stats|doctor|reset] [--lang a,b]',
}

/** Record a status and let the pane react (count the wait, serve a question, flash). */
export async function signal(io: Io, status: Status | null): Promise<void> {
  if (status === null) return
  const was = await setStatus(io, status)
  await onStatus(io, was, status)
}

/** Session start (and every reload): Python's `biteq pane` at boot, without taking the keys. */
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
  const questions = await loadQuestions(io, langs)
  if (!questions.length) {
    const counts = Object.entries(available).sort().map(([k, v]) => `${k} ${v}`).join(', ')
    return `biteq: no questions for ${langs.join(',')}. Counts: ${counts}. Run /biteq langs.`
  }
  if (lang !== undefined) await setLangs(io, langs)   // remembered for the next session
  await bootPane(io, questions)
  const placed = await openPane(io, focus)
  if (!placed) return 'biteq: the pane will show up once this window is wide enough.'
  const how = (await io.surface()) === 'terminal'
    ? 'ctrl+x tab gives the pane the keyboard: a-d answer, n next, s skip, q close.'
    : 'click an answer, then Next.'
  return `biteq: ${questions.length} questions (${langs.join(', ')}). ${how}`
}

async function cmdLangs(io: Io): Promise<string> {
  const chosen = await getLangs(io)
  return Object.entries(await languageCounts(io)).sort()
    .map(([lang, n]) => `${lang.padEnd(8)} ${String(n).padStart(3)} questions${chosen.includes(lang) ? '   <- selected' : ''}`)
    .join('\n')
}

async function cmdCheck(io: Io): Promise<string> {
  const { summary, errors } = await validate(io)
  return [summary, ...errors.map(e => `ERROR ${e}`)].join('\n')
}

async function cmdStats(io: Io): Promise<string> {
  const s = await loadStats(io)
  const pct = (a: number, b: number) => (b ? `${Math.floor((100 * a) / b)}%` : 'n/a')
  return [
    `answered      ${s.answered}  (${pct(s.correct, s.answered)} correct)`,
    `streak        ${s.streak}  (best ${s.best_streak})`,
    `AI waits      ${s.waits}  (you practiced during ${pct(s.engaged_waits, s.waits)} of them)`,
    ...Object.entries(s.by_lang).sort().map(([lang, [c, n]]) => `  ${lang.padEnd(10)} ${c}/${n}`),
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
    `surface       ${(await io.surface()) ?? 'none (headless)'}`,
    `store         ${storeOk}`,
    `status        ${await io.get('status')}`,
    `debug log     ${(await debugEnabled(io)) ? await eventsLog(io) : 'off (set BITEQ_DEBUG=1 to record events)'}`,
    `questions     ${total} (${Object.entries(counts).sort().map(([k, n]) => `${k} ${n}`).join(', ')})`,
    `selected      ${(await getLangs(io)).join(',')}`,
  ].join('\n')
}

async function cmdReset(io: Io, all: boolean): Promise<string> {
  const removed = ['status']
  await setStatus(io, 'idle')
  if (all) {
    await io.storeDelete(STATS)
    await io.storeDelete(CONFIG)
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
    case 'start': await signal(io, 'thinking'); return 'biteq: marked thinking'
    case 'stop': await signal(io, 'done'); return 'biteq: marked done'
    default:
      return 'usage: /biteq [pane] [--lang a,b] | langs | check | stats | doctor | reset [--all] | start | stop'
  }
}
