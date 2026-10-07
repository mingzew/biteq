// biteq: bite-size coding questions in a Claude Code pane while Claude works.
//
// Entry point (Python: bin/biteq + hooks/hooks.json). Runs inside Claude Code's own engine:
// no Python, Node or binary to install. This is the only file that touches the engine's `$`
// (the engine doesn't let it cross an import): it wires Claude Code's events to the modules
// in ./biteq and builds the `io` they take. One module per Python module in plugins/biteq/lib:
//   cli     /biteq subcommands, and signal(): every status goes through it
//   store   store keys, JSON helpers, this session's status
//   claude  engine event -> status (parse)
//   pane    the pane: questions, answering, render()
//   quiz    question banks, stats, validation
//   config  remembered languages
//   debug   BITEQ_DEBUG event log
//   macos   stubs
//   io      what the modules may do through the engine (no Python counterpart)
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { parse } from './biteq/claude'
import type { ClaudeEvent } from './biteq/claude'
import { COMMAND, boot, run, signal, typedArgs } from './biteq/cli'
import { logEvent } from './biteq/debug'
import type { Io, View } from './biteq/io'
import { closed, press, render, tick, view } from './biteq/pane'
import { DEFAULT_STATS } from './biteq/quiz'

const PANE = 'biteq'

// The session's state, one atom per key of the contract in types/index.d.ts. The engine wants
// every read and write to name its atom directly, hence the switches in io() below
// Human explanation: We are initializing these variables with the default values that will be stored in Claude's engine session on first read or update.
// Note these are session variables and will be swiped when a user closes the session. Also if the user has multiple sessions, there will be another set of variables.
const status = atom({ plugin: 'biteq-ts', key: 'status' } as const, 'idle')
const since = atom({ plugin: 'biteq-ts', key: 'since' } as const, 0)
const current = atom({ plugin: 'biteq-ts', key: 'current' } as const, { question: null, picked: null })
const engaged = atom({ plugin: 'biteq-ts', key: 'engaged' } as const, false)
const dismissed = atom({ plugin: 'biteq-ts', key: 'dismissed' } as const, false)
const stats = atom({ plugin: 'biteq-ts', key: 'stats' } as const, DEFAULT_STATS)

function io($: EngineInterface): Io {
  return {
    storeGet: key => $.store.get(key),
    storeSet: (key, value) => $.store.set(key, value),
    storeDelete: key => $.store.delete(key),
    get: (async (key: keyof View) => {
      switch (key) {
        case 'status': return read($, status)
        case 'since': return read($, since)
        case 'current': return read($, current)
        case 'engaged': return read($, engaged)
        case 'dismissed': return read($, dismissed)
        case 'stats': return read($, stats)
      }
    }) as unknown as Io['get'],
    // each case passes `change` to its own atom; the public type (Io['set']) keeps callers exact
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set: (async (key: keyof View, change: (value: any) => any) => {
      switch (key) {
        case 'status': return update($, status, change)
        case 'since': return update($, since, change)
        case 'current': return update($, current, change)
        case 'engaged': return update($, engaged, change)
        case 'dismissed': return update($, dismissed, change)
        case 'stats': return update($, stats, change)
      }
    }) as unknown as Io['set'],
    pluginRoot: $.plugin.root,
    list: dir => $.fs.list(dir),
    read: async path => String(await $.fs.read(path)),
    write: (path, text) => $.fs.write(path, text),
    exists: path => $.fs.exists(path),
    env: name => {
      switch (name) {
        case 'BITEQ_DEBUG': return $.env.get('BITEQ_DEBUG')
        case 'BITEQ_HOME': return $.env.get('BITEQ_HOME')
        case 'HOME': return $.env.get('HOME')
        case 'USERPROFILE': return $.env.get('USERPROFILE')
      }
    },
    openPane: async focus =>
      (await $.ui.open(focus ? { id: PANE, title: 'biteq', focus: true } : { id: PANE, title: 'biteq' })).isPlaced,
    closePane: () => $.ui.close({ id: PANE }),
    toast: text => $.ui.toast(text),
    redraw: () => $.ui.invalidate('ui.render'),
    now: () => $.clock.now(),
    version: async () => (await $.session.version()).version,
    surface: () => $.session.surface(),
  }
}

async function claudeEvent($: EngineInterface, e: ClaudeEvent): Promise<void> {
  const it = io($)
  void logEvent(it, 'claude', e)
  await signal(it, parse(e))
}

export const register: Register = on => {
  // ---- boot and the /biteq command (cli)
  on('session.start', async ($, e, next) => {
    await $.command.register(COMMAND)
    await boot(io($))
    $.clock.every(1000, () => void tick(io($)))   // the thinking timer (Python repaints every 250 ms)
    return next(e)
  })

  on('command.run', { command: 'biteq' }, async ($, e) => ({ text: await run(io($), e.args) }))

  // The desktop Code tab may not list a command the plugin registered after it started, and then
  // "/biteq" arrives as a plain prompt: run it here and drop it, so it never reaches Claude.
  on('prompt.submit', async ($, e, next) => {
    const args = typedArgs(e.text)
    if (args === null) return next(e)
    return { drop: await run(io($), args) }
  })

  // ---- Claude Code events -> status (claude.parse, then cli.signal)
  on('turn.start', async ($, e, next) => {
    await claudeEvent($, { event: 'turn.start' })
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await claudeEvent($, { event: 'turn.complete', agentId: e.agentId })
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    await claudeEvent($, { event: 'tool.before', tool: e.tool })
    const result = await next(e)
    await claudeEvent($, { event: 'tool.after', tool: e.tool })
    return result
  })

  on('classic.Notification', async ($, e, next) => {
    await claudeEvent($, { event: 'notification', notification_type: e.notification_type })
    return next(e)
  })

  // ---- the pane
  on('ui.close', async ($, e, next) => {
    if (e.id === PANE && e.origin.kind === 'person') await closed(io($))
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) =>
    render(await view(io($)), $.ui.resolve(e), e.surface))

  // Take the pane's presses by key, before the engine looks up the drawing's handler: a click
  // from a drawing that was just replaced (the timer redraws every second) still lands.
  on('ui.press', async ($, e, next) => {
    if (e.plugin !== 'biteq-ts' || e.requestId !== PANE) return next(e)
    await press(io($), e.element)
    return { element: e.element }
  })
}
