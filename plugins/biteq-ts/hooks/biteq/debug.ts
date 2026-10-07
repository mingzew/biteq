// Optional raw event log. Enable with BITEQ_DEBUG=1 in the environment Claude Code runs in;
// writes ~/.biteq/events-ts.log (one line per event: ISO time, source, payload).
import type { Io } from './io'
import { eventsLog } from './store'

const MAX_BYTES = 1024 * 1024

export async function enabled(io: Io): Promise<boolean> {
  const value = ((await io.env('BITEQ_DEBUG')) ?? '').toLowerCase()
  return !['', '0', 'false', 'no'].includes(value)
}

/** Append one line. Never throws. (The engine's file API has no append: read, add, write.) */
export async function logEvent(io: Io, source: string, payload: unknown): Promise<void> {
  try {
    if (!(await enabled(io))) return
    await write(io, source, payload)
  } catch {
    // a debug log must never break a hook
  }
}

/** Same file as logEvent, but always writes. Used to verify the desktop click build. */
export async function logAlways(io: Io, source: string, payload: unknown): Promise<void> {
  try {
    await write(io, source, payload)
  } catch {
    // a debug log must never break a hook
  }
}

async function write(io: Io, source: string, payload: unknown): Promise<void> {
  const path = await eventsLog(io)
  let text = (await io.exists(path)) ? await io.read(path) : ''
  if (text.length > MAX_BYTES) {
    await io.write(`${path}.1`, text)
    text = ''
  }
  const line = `${new Date().toISOString().slice(0, 19)}\t${source}\t${JSON.stringify(payload)}\n`
  await io.write(path, text + line)
}
