// biteq: bite-size coding questions in a Claude Code pane while Claude works.
//
// Entry point. Runs inside Claude Code's own engine: no Python, Node or binary to install.
// This is the only file that touches the engine's `$` (the engine doesn't let it cross an
// import): it wires Claude Code's events to the modules in ./biteq and builds the `io` they take:
//   cli     /biteq subcommands, and signal(): every status goes through it
//   store   store keys, JSON helpers, this session's status
//   claude  engine event -> status (parse)
//   pane    the pane: questions, answering, the bank screen, render()
//   quiz    question banks, stats, validation
//   config  remembered languages
//   debug   event log, on after /biteq debug
//   macos   stubs
//   telemetry  a placed pane and a recorded answer
//   io      what the modules may do through the engine
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement } from 'claude-code'

import { parse } from './biteq/claude'
import type { ClaudeEvent } from './biteq/claude'
import { COMMAND, boot, run, signal, typedArgs } from './biteq/cli'
import { toClient, traitsOf } from './biteq/client'
import { logEvent, rememberClaude } from './biteq/debug'
import type { Io, View } from './biteq/io'
import { isHintKey } from './biteq/draw'
import { closed, press, render, view } from './biteq/pane'
import { DEFAULT_STATS } from './biteq/quiz'
import { reportOpen } from './biteq/telemetry'

const PANE = 'biteq'
const QUIZ = 'quiz'

// Desktop Client failed: fall back to the pane hook's own tree (ui.fault).
let clientOk = true

// The session's state, one atom per key of the contract in types/index.d.ts. The engine wants
// every read and write to name its atom directly, hence the switches in io() below
// Human explanation: We are initializing these variables with the default values that will be stored in Claude's engine session on first read or update.
// Note these are session variables and will be swiped when a user closes the session. Also if the user has multiple sessions, there will be another set of variables.
const status = atom({ plugin: 'biteq', key: 'status' } as const, 'idle')
const current = atom({ plugin: 'biteq', key: 'current' } as const, { question: null, picked: null })
const engaged = atom({ plugin: 'biteq', key: 'engaged' } as const, false)
const dismissed = atom({ plugin: 'biteq', key: 'dismissed' } as const, false)
const openReported = atom({ plugin: 'biteq', key: 'openReported' } as const, false)
const stats = atom({ plugin: 'biteq', key: 'stats' } as const, DEFAULT_STATS)
const picker = atom({ plugin: 'biteq', key: 'picker' } as const, { open: false, selected: [] })

function io($: EngineInterface): Io {
  const it: Io = {
    storeGet: key => $.store.get(key),
    storeSet: (key, value) => $.store.set(key, value),
    storeDelete: key => $.store.delete(key),
    get: (async (key: keyof View) => {
      switch (key) {
        case 'status': return read($, status)
        case 'current': return read($, current)
        case 'engaged': return read($, engaged)
        case 'dismissed': return read($, dismissed)
        case 'openReported': return read($, openReported)
        case 'stats': return read($, stats)
        case 'picker': return read($, picker)
      }
    }) as unknown as Io['get'],
    // each case passes `change` to its own atom; the public type (Io['set']) keeps callers exact
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set: (async (key: keyof View, change: (value: any) => any) => {
      switch (key) {
        case 'status': return update($, status, change)
        case 'current': return update($, current, change)
        case 'engaged': return update($, engaged, change)
        case 'dismissed': return update($, dismissed, change)
        case 'openReported': return update($, openReported, change)
        case 'stats': return update($, stats, change)
        case 'picker': return update($, picker, change)
      }
    }) as unknown as Io['set'],
    pluginRoot: $.plugin.root,
    list: dir => $.fs.list(dir),
    read: async path => String(await $.fs.read(path)),
    write: (path, text) => $.fs.write(path, text),
    exists: path => $.fs.exists(path),
    env: name => {
      switch (name) {
        case 'BITEQ_HOME': return $.env.get('BITEQ_HOME')
        case 'HOME': return $.env.get('HOME')
        case 'USERPROFILE': return $.env.get('USERPROFILE')
      }
    },
    openPane: async focus =>
      (await $.ui.open(focus ? { id: PANE, title: 'biteq', focus: true } : { id: PANE, title: 'biteq' })).isPlaced,
    closePane: () => $.ui.close({ id: PANE }),
    focus: async key => {
      try { await $.ui.focus({ requestId: PANE, key }) } catch { /* deny, or a surface with no ring */ }
    },
    client: async () => toClient(await $.session.surface()),
    traits: async () => traitsOf(toClient(await $.session.surface())),
    version: async () => (await $.session.version()).version,
    sessionId: () => $.session.id(),
    httpPost: async (url, body) => {
      const response = await $.http.fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      })
      return { ok: response.ok }
    },
  }
  // Report after a placement. The wrapper runs once `it` exists, so reportOpen can use this same io.
  const openPane = it.openPane
  it.openPane = async focus => {
    const placed = await openPane(focus)
    if (placed) void reportOpen(it)
    return placed
  }
  return it
}

async function claudeEvent($: EngineInterface, e: ClaudeEvent): Promise<void> {
  const it = io($)
  rememberClaude(e)
  void logEvent(it, 'claude', e)
  await signal(it, parse(e))
}

/** A docked pane's body rows (the hint bar goes on the last); none inline, where it fits its content. */
function fillRows(props: { placement: 'dock' | 'inline'; scroll: { bodyRows: number } }): number | undefined {
  return props.placement === 'dock' && props.scroll.bodyRows > 0 ? props.scroll.bodyRows : undefined
}

export const register: Register = on => {
  // ---- boot and the /biteq command (cli)
  on('session.start', async ($, e, next) => {
    await $.command.register(COMMAND)
    await boot(io($))
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

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const quiz = await view(io($))
    const el = $.ui.resolve(e)
    const traits = traitsOf(toClient(e.surface))
    // Desktop: a Client keeps the quiz on the drawing thread. Plugin redraws
    // remount the pane webview, and the next click only focuses it. Its props
    // are the quiz and the client's traits alone, so a focus change does not redraw that webview.
    if (traits.clientModule && clientOk && 'Client' in el) {
      try {
        const { Box, Client } = el
        const tree = h(Box, { flexDirection: 'column', flexGrow: 1 },
          h(Client, { key: QUIZ, module: './biteq/quiz-client.tsx', props: { ...quiz, traits }, flexGrow: 1 }))
        if (tree) return tree as RenderElement
        clientOk = false
      } catch {
        clientOk = false
      }
    }
    return render(traits.dimsWhenUnfocused ? { ...quiz, focused: e.props.isFocused } : quiz, el, traits, fillRows(e.props))
  }).catch(async ($, e, next) => {
    clientOk = false
    if (next.called) return next(e)
    const quiz = await view(io($))
    const traits = traitsOf(toClient(e.surface))
    return render(traits.dimsWhenUnfocused ? { ...quiz, focused: e.props.isFocused } : quiz, $.ui.resolve(e), traits, fillRows(e.props))
  })

  on('ui.message', async ($, e) => {
    const data = e.data
    const key = data && typeof data === 'object' && 'key' in data ? String((data as { key: unknown }).key) : ''
    if (!key) return {}
    await press(io($), key)
    return { props: { ...(await view(io($))), traits: traitsOf(toClient(e.surface)) } }
  })

  on('ui.fault', async ($, e, next) => {
    if (e.element === QUIZ) clientOk = false
    return next(e)
  })

  // The hint bar (next/skip, close): pressed by hotkey only, so the arrow keys and Tab skip it and
  // only walk the answers. A person's move names its target `element`; the plugin's own
  // `$.ui.focus` names it `key`. Clients without a hint bar keep Next/Close as focusable buttons.
  on('ui.focus', async ($, e, next) => {
    const target = e.element ?? (e as { key?: string }).key
    if (e.requestId === PANE && target && isHintKey(target) && traitsOf(toClient(await $.session.surface())).hintBar) {
      return { deny: 'hint bar: pressed by its hotkey' }
    }
    return next(e)
  })

  // Take the pane's presses by key, before the engine looks up the drawing's handler: a click
  // from a drawing that was just replaced (any state change redraws it) still lands.
  on('ui.press', async ($, e, next) => {
    if (e.plugin !== 'biteq' || e.requestId !== PANE) return next(e)
    await press(io($), e.element)
    return { element: e.element }
  })
}
