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
  practicality: number   // 1-10: how close to code people write day to day (10) vs trivia or a contrived trick (1)
  source?: string        // where an imported question came from; licences in data/questions/ATTRIBUTION.md
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
  // every question ever answered: whether its first answer was right. Start over keeps it (only
  // reset --all clears it), so a repeat can't count
  one_shot: Record<string, boolean>
  by_lang: Record<string, [number, number]>
}

// The question on screen and the option picked for it: one value, so a change is one redraw
export type Current = { question: Question | null; picked: number | null }

// The bank screen (z): whether it's showing, and the banks checked on it (saved as they change)
export type Picker = { open: boolean; selected: string[] }

declare module 'claude-code' {
  interface PluginState {
    'biteq': {
      status: Status
      current: Current
      engaged: boolean
      dismissed: boolean
      openReported: boolean
      stats: Stats
      picker: Picker
    }
  }
}
