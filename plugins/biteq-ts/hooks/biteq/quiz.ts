// Question banks (one JSON file per language) and the stats.
//
// Bank layout: data/questions/<lang>.json, each a JSON array of
//     {id, title, prompt, code, options[2-4], answer (index), explanation}
// The language is the filename; it is added to each question as q.lang when loaded.
// Question ids must start with "<lang>-" and be unique across all banks.
import type { Question, Stats } from '../../types'
import type { Io } from './io'
import { STATS, loadJson, saveJson } from './store'

export const DEFAULT_STATS: Stats = {
  answered: 0, correct: 0, streak: 0, best_streak: 0,
  waits: 0, engaged_waits: 0, seen: [], wrong: [], by_lang: {},
}

const REQUIRED = ['id', 'prompt', 'options', 'answer', 'explanation'] as const

export async function loadStats(io: Io): Promise<Stats> {
  return { ...DEFAULT_STATS, ...(await loadJson<Partial<Stats>>(io, STATS, {})) }
}

/** Read, change, write. Re-reads first so two sessions answering at once don't erase each other. */
export async function saveStats(io: Io, change: (s: Stats) => Stats): Promise<Stats> {
  const next = change(await loadStats(io))
  await saveJson(io, STATS, next)
  return next
}

export function questionsDir(io: Io): string {
  return `${io.pluginRoot}/data/questions`
}

/** The bank files, sorted, as { lang, path }. */
export async function bankFiles(io: Io): Promise<{ lang: string; path: string }[]> {
  const dir = questionsDir(io)
  const entries = await io.list(dir).catch(() => [])
  return entries
    .filter(e => e.name.endsWith('.json'))
    .map(e => ({ lang: e.name.slice(0, -'.json'.length), path: `${dir}/${e.name}` }))
    .sort((a, b) => a.lang.localeCompare(b.lang))
}

/** Questions from one bank file, each tagged with q.lang. */
export async function loadBank(io: Io, lang: string, path: string): Promise<Question[]> {
  const questions = JSON.parse(await io.read(path)) as Question[]
  return questions.map(q => ({ ...q, lang }))
}

/** { lang: question count } for every bank file, including empty ones. */
export async function languageCounts(io: Io): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const { lang, path } of await bankFiles(io)) {
    counts[lang] = await loadBank(io, lang, path).then(qs => qs.length, () => 0)
  }
  return counts
}

/** The order languages are served in: the selected ones as given, then every other bank A-Z. */
export function languageOrder(selected: string[], available: string[]): string[] {
  const first = selected.filter(l => available.includes(l))
  return [...first, ...available.filter(l => !first.includes(l)).sort()]
}

/** All questions for the given languages, in that order (unknown/empty/broken languages contribute none). */
export async function loadQuestions(io: Io, langs: string[]): Promise<Question[]> {
  const files = await bankFiles(io)
  const out: Question[] = []
  for (const lang of langs) {
    const file = files.find(f => f.lang === lang)
    if (file) out.push(...(await loadBank(io, lang, file.path).catch(() => [])))
  }
  return out
}

/** Returns { summary, errors } for the whole question directory. */
export async function validate(io: Io): Promise<{ summary: string; errors: string[] }> {
  const errors: string[] = []
  const ids: Record<string, string> = {}
  const counts: Record<string, number> = {}
  const files = await bankFiles(io)
  if (!files.length) return { summary: `no question banks found in ${questionsDir(io)}`, errors: ['no *.json files'] }
  for (const { lang, path } of files) {
    const name = `${lang}.json`
    let questions: unknown
    try {
      questions = JSON.parse(await io.read(path))
    } catch (e) {
      errors.push(`${name}: invalid JSON (${e instanceof Error ? e.message : e})`)
      continue
    }
    if (!Array.isArray(questions)) {
      errors.push(`${name}: top level must be an array`)
      continue
    }
    counts[lang] = questions.length
    questions.forEach((q: Record<string, unknown>, i) => {
      const qid = String(q.id ?? `${lang}#${i}`)
      for (const key of REQUIRED) if (!(key in q)) errors.push(`${qid}: missing ${key}`)
      if (!qid.startsWith(`${lang}-`)) errors.push(`${qid}: id must start with '${lang}-'`)
      if (qid in ids) errors.push(`${qid}: duplicate id (also in ${ids[qid]})`)
      ids[qid] = name
      const n = Array.isArray(q.options) ? q.options.length : 0
      if (n < 2 || n > 4) errors.push(`${qid}: needs 2-4 options`)
      const answer = typeof q.answer === 'number' ? q.answer : -1
      if (answer < 0 || answer >= n) errors.push(`${qid}: answer out of range`)
    })
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const list = Object.entries(counts).sort().map(([k, v]) => `${k} ${v}`).join(', ')
  return { summary: `${total} questions in ${Object.keys(counts).length} banks: ${list}`, errors }
}
