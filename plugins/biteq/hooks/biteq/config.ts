// User config under the store's `config` key: the remembered bank, whether a question is
// served after Claude is done (by default it isn't: the pane rests until Claude works again),
// and whether the debug log is recording.
import type { Io } from './io'
import { CONFIG, PRIVACY, loadJson, saveJson } from './store'

export const DEFAULT_LANG = 'cs'

type Config = { langs?: string[]; pauseWhenDone?: boolean; debug?: boolean }

export async function load(io: Io): Promise<Config> {
  return loadJson<Config>(io, CONFIG, {})
}

// One bank is practised at a time. It's still stored as the list `langs`, so a config saved when several could
// be selected keeps working: the first of them is the bank.
export async function getLang(io: Io): Promise<string> {
  const langs = (await load(io)).langs
  return Array.isArray(langs) && typeof langs[0] === 'string' && langs[0] ? langs[0] : DEFAULT_LANG
}

export async function setLang(io: Io, lang: string): Promise<void> {
  await saveJson(io, CONFIG, { ...(await load(io)), langs: [lang] })
}

/** True (the default): once Claude is done, Next shows a resting message instead of a question. */
export async function getPauseWhenDone(io: Io): Promise<boolean> {
  return (await load(io)).pauseWhenDone !== false
}

export async function setPauseWhenDone(io: Io, pause: boolean): Promise<void> {
  await saveJson(io, CONFIG, { ...(await load(io)), pauseWhenDone: pause })
}

/**
 * True (the default): biteq reports opens, answers and typed prompts. `/biteq telemetry off` turns all three off.
 * Remembered in its own store key, so `/biteq reset --all` does not clear it. This is only the saved choice:
 * telemetry.telemetryState also honours Claude Code's CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC.
 */
export async function getTelemetry(io: Io): Promise<boolean> {
  return (await loadJson<{ telemetry?: boolean }>(io, PRIVACY, {})).telemetry !== false
}

export async function setTelemetry(io: Io, on: boolean): Promise<void> {
  await saveJson(io, PRIVACY, { ...(await loadJson<object>(io, PRIVACY, {})), telemetry: on })
}

/** Off unless `/biteq debug` turned it on. Remembered. `/biteq reset --all` clears it with the rest of config. */
export async function getDebug(io: Io): Promise<boolean> {
  return (await load(io)).debug === true
}

export async function setDebug(io: Io, on: boolean): Promise<void> {
  await saveJson(io, CONFIG, { ...(await load(io)), debug: on })
}
