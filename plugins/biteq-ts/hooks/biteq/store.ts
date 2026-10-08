// Storage: the plugin store's keys, JSON helpers,
// and this session's status.
//
// Only the session status is written by this module. The other keys (stats, config) are
// defined here but written by quiz and config; the debug log is a file, written by debug.
//
// Each Claude Code session runs its own copy of the plugin and draws its own pane, so the status
// is one value in the session's state (which also survives a hot reload).
import type { Status } from '../../types'
import type { Io } from './io'

// Store keys: one JSON file of the plugin's own under ~/.claude/plugins/store/, across sessions
export const STATS = 'stats'
export const CONFIG = 'config'

/** The debug log is a real file, under ~/.biteq (or BITEQ_HOME). */
export async function eventsLog(io: Io): Promise<string> {
  const home = (await io.env('BITEQ_HOME'))
    ?? `${(await io.env('HOME')) ?? (await io.env('USERPROFILE')) ?? '.'}/.biteq`
  return `${home}/events-ts.log`
}

export async function loadJson<T>(io: Io, key: string, fallback: T): Promise<T> {
  try {
    const value = await io.storeGet(key)
    return value === undefined ? fallback : (value as T)
  } catch {
    return fallback
  }
}

export async function saveJson(io: Io, key: string, value: unknown): Promise<void> {
  await io.storeSet(key, value)
}

/** Record this session's status; returns the previous one. `since` only moves on a change. */
export async function setStatus(io: Io, next: Status): Promise<Status> {
  const prev = await io.get('status')
  if (prev !== next) {
    await io.set('status', () => next)
    const now = await io.now()
    await io.set('since', () => now)
  }
  return prev
}
