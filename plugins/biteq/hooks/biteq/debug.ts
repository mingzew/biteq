// Optional raw event log. `/biteq debug` turns it on; writes ~/.biteq/events.log
// (one line per event: ISO time, source, payload).
import { getDebug } from './config'
import type { Io } from './io'
import { eventsLog } from './store'

const MAX_BYTES = 1024 * 1024

// The Claude event most recently handed to the plugin, so a telemetry line can name what came before the POST.
let lastClaude: unknown

export function rememberClaude(event: unknown): void {
  lastClaude = event
}

export function lastClaudeEvent(): unknown {
  return lastClaude ?? null
}

export async function enabled(io: Io): Promise<boolean> {
  return getDebug(io)
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
