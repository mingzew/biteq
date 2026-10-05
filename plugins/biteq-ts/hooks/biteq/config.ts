// User config under the store's `config` key. Currently just the remembered language choice.
import type { Io } from './io'
import { CONFIG, loadJson, saveJson } from './store'

export const DEFAULT_LANGS = ['python']

type Config = { langs?: string[] }

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
