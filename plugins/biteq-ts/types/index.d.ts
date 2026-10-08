export type Status = 'idle' | 'thinking' | 'waiting' | 'done'

export type Question = {
  id: string
  lang: string
  title?: string
  prompt: string
  code?: string
  options: string[]
  answer: number
  explanation: string
  hard?: boolean
}

// Persisted in the plugin store under `stats`, shared by every session
export type Stats = {
  answered: number
  correct: number
  streak: number
  best_streak: number
  waits: number
  engaged_waits: number
  seen: string[]
  wrong: string[]
  by_lang: Record<string, [number, number]>
}

// The question on screen and the option picked for it: one value, so a change is one redraw
export type Current = { question: Question | null; picked: number | null }

declare module 'claude-code' {
  interface PluginState {
    'biteq-ts': {
      status: Status
      since: number
      current: Current
      engaged: boolean
      dismissed: boolean
      stats: Stats
    }
  }
}
