// User config under the store's `config` key: the remembered languages, whether a question is
// served after Claude is done (by default it isn't: the pane rests until Claude works again),
// and whether the debug log is recording.
import type { Io } from './io'
import { CONFIG, loadJson, saveJson } from './store'

export const DEFAULT_LANGS = ['cs']

type Config = { langs?: string[]; pauseWhenDone?: boolean; debug?: boolean }

export async function load(io: Io): Promise<Config> {
  return loadJson<Config>(io, CONFIG, {})
}

export async function getLangs(io: Io): Promise<string[]> {
  const langs = (await load(io)).langs
  return Array.isArray(langs) && langs.length ? langs : [...DEFAULT_LANGS]
}

export async function setLangs(io: Io, langs: string[]): Promise<void> {
  await saveJson(io, CONFIG, { ...(await load(io)), langs: [...langs] })
}

/** True (the default): once Claude is done, Next shows a resting message instead of a question. */
export async function getPauseWhenDone(io: Io): Promise<boolean> {
  return (await load(io)).pauseWhenDone !== false
}

export async function setPauseWhenDone(io: Io, pause: boolean): Promise<void> {
  await saveJson(io, CONFIG, { ...(await load(io)), pauseWhenDone: pause })
}

/** Off unless `/biteq debug` turned it on. Remembered. `/biteq reset --all` clears it with the rest of config. */
export async function getDebug(io: Io): Promise<boolean> {
  return (await load(io)).debug === true
}

export async function setDebug(io: Io, on: boolean): Promise<void> {
  await saveJson(io, CONFIG, { ...(await load(io)), debug: on })
}
