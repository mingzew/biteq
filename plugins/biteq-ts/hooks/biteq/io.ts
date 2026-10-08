// What the modules may do outside themselves.
//
// Claude Code's engine only lets its handle `$` be used in the file whose hook received it,
// never passed across an import. So register.ts (the only file that touches `$`) builds this
// object of small closures for each event, and every other module takes it as `io`.
import type { PluginState } from 'claude-code'

/** This session's values the pane draws from ($.state); declared in types/index.d.ts. */
export type View = PluginState['biteq-ts']

/** The environment variables biteq reads (the engine wants each read named literally). */
export type EnvName = 'BITEQ_DEBUG' | 'BITEQ_HOME' | 'HOME' | 'USERPROFILE'

export type Io = {
  // persisted across sessions ($.store)
  storeGet: (key: string) => Promise<unknown>
  storeSet: (key: string, value: unknown) => Promise<void>
  storeDelete: (key: string) => Promise<void>

  // this session ($.state): reading inside the pane's drawing subscribes it to the value
  get: <K extends keyof View>(key: K) => Promise<View[K]>
  set: <K extends keyof View>(key: K, change: (value: View[K]) => View[K]) => Promise<View[K]>

  // files and environment
  pluginRoot: string
  list: (dir: string) => Promise<{ name: string }[]>
  read: (path: string) => Promise<string>
  write: (path: string, text: string) => Promise<void>
  exists: (path: string) => Promise<boolean>
  env: (name: EnvName) => Promise<string | undefined>

  // the pane and notices
  openPane: (focus: boolean) => Promise<boolean>   // false: the surface can't place it yet
  closePane: () => Promise<void>
  focus: (key: string) => Promise<void>   // move the pane's focus ring; a deny is ignored
  redraw: () => void   // draw the pane again, though no state changed (the thinking timer)

  // the engine's clock (a test can move it), in milliseconds
  now: () => Promise<number>

  // about this session, for /biteq doctor
  version: () => Promise<string>
  surface: () => Promise<string | null>
}
