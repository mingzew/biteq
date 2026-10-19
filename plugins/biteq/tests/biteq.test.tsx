// Run: claude plugin test plugins/biteq
//
// The engine's test kit: `$` is the engine's own, and the hooks a test registers with `on`
// stand for everything beneath the plugin (files, store, the session), answered from memory.
import type { On } from 'claude-code'
import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'

const BANKS: Record<string, unknown[]> = {
  python: [
    { id: 'python-a', title: 'A', prompt: 'Pick a', options: ['a1', 'a2'], answer: 0, explanation: 'because', practicality: 5 },
    { id: 'python-b', title: 'B', prompt: 'Pick b', options: ['b1', 'b2'], answer: 0, explanation: 'because', practicality: 5 },
  ],
  js: [{ id: 'js-a', title: 'J', prompt: 'Pick j', options: ['j1', 'j2'], answer: 0, explanation: 'because', practicality: 5 }],
  ruby: [
    { id: 'ruby-a', title: 'R', prompt: 'Pick r', options: ['r1', 'r2'], answer: 0, explanation: 'because', practicality: 5 },
    { id: 'ruby-b', title: 'S', prompt: 'Pick s', options: ['s1', 's2'], answer: 0, explanation: 'because', practicality: 5 },
  ],
  cs: [
    { id: 'cs-a', title: 'C', prompt: 'Pick c', options: ['c1', 'c2'], answer: 0, explanation: 'because' },
    { id: 'cs-b', title: 'K', prompt: 'Pick k', options: ['k1', 'k2'], answer: 0, explanation: 'because' },
  ],
  go: [],
}

const PANE = {
  component: 'Pane',
  requestId: 'biteq',
  props: {
    title: 'biteq', isFocused: true, bodyColumns: 60, placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 }, view: {},
  },
} as const

const RESTING = /^Claude is done, go review\. The next time Claude cooks, we will serve the question\.$/

const DONE = { reason: 'answer', answer: 'done', durationMs: 1, isAborted: false, turnId: 't1' } as const

// Everything beneath the plugin: question banks, an in-memory store, no env, and the engine's answers.
// Calls on $ answer { value } (or { deny }); events answer their own result.
// `shared`: a store the test can also write to, standing for another Claude session using it
function world(on: On, banks: Record<string, unknown[]> = BANKS, surface = 'terminal', shared?: Record<string, unknown>, writes?: string[]) {
  const opened: { focus?: true }[] = []
  if (shared) {
    on('store.get', ($, e) => ({ value: shared[e.key] }))
    on('store.set', ($, e) => {
      shared[e.key] = JSON.parse(JSON.stringify(e.value))
      return { value: undefined }
    })
    on('store.delete', ($, e) => {
      delete shared[e.key]
      return { value: undefined }
    })
    on('store.keys', () => ({ value: Object.keys(shared) }))
  } else {
    mock.store(on)
  }
  mock.env(on, {})
  on('fs.exists', () => ({ value: true }))
  on('fs.list', () => ({
    value: Object.keys(banks).map(lang => ({ name: `${lang}.json`, kind: 'file', size: 1, mtimeMs: 0, isLink: false })),
  }) as never)
  on('fs.read', ($, e) => ({ value: JSON.stringify(banks[String(e.path).split('/').pop()!.replace('.json', '')] ?? []) }))
  on('fs.write', ($, e) => {
    writes?.push(JSON.stringify(e))
    return { value: undefined }
  })
  on('command.register', () => ({ value: undefined }) as never)
  on('ui.open', ($, e) => {
    opened.push(e)
    return { value: { isPlaced: true } }
  })
  on('ui.close', () => ({ value: undefined }) as never)
  on('ui.focus', () => ({}))   // beneath the plugin: the ring moves
  on('session.version', () => ({ value: { version: '2.1.x', base: '2.1.x' } }) as never)
  on('session.surface', () => ({ value: surface }) as never)
  on('classic.Notification', () => ({}) as never)
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('command.run', () => ({ text: '' }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', ($, e) => ({ text: e.answer }))
  return { opened }
}

// The pane's Buttons are keyed by action and question (`answer:0:python-a`, `next:python-a`),
// so tests find them by label and press the key they carry.
type Drawing = Mounted<'terminal' | 'desktop' | 'vscode', 'Pane'>
const OPTION = (letter: string, surface?: string) =>
  new RegExp(`^${letter}${surface === 'desktop' ? ':' : '\\)'} `)
// Terminal unanswered labels are the option text (hotkey paints "a:"); BANKS use a1, b1, c1, j1, k1, m1, r1, s1.
const OPEN = (ui: Drawing, letter: string) => {
  if (ui.surface === 'terminal') {
    const n = 'abcd'.indexOf(letter) + 1
    return new RegExp(`^[abcjkmrs]${n}$`)
  }
  return OPTION(letter, ui.surface)
}
const ANSWERED = (ui: Drawing) => (ui.surface === 'desktop' ? /[✓✗] a: / : /[✓✗] a\) /)
const inQuiz = (ui: Drawing) => (ui.surface === 'desktop' ? { in: 'quiz' } : {})
async function find(ui: Drawing, query: { type?: string; text?: RegExp }) {
  return ui.find({ ...query, ...inQuiz(ui) })
}
async function keyOf(ui: Drawing, label: RegExp): Promise<string> {
  const el = await find(ui, { type: 'Button', text: label })
  if (!el?.key) throw new Error(`no button ${label}`)
  return el.key
}
async function click(ui: Drawing, label: RegExp) {
  return ui.press({ key: await keyOf(ui, label), ...inQuiz(ui) })
}

describe('pane', () => {
  for (const surface of ['terminal', 'desktop', 'vscode'] as const) {
    test(`${surface}: a prompt serves a question; answer, verdict, done, next`, async ($, on) => {
      world(on, BANKS, surface)
      await $.session.start({ cwd: '.', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'biteq', surface, ...PANE })
      if (surface === 'desktop') {
        expect(await find(ui, { text: /^BiteQ$/ })).toBeUndefined()
        expect(await find(ui, { text: /Bite Size Coding Questions/ })).toBeUndefined()
      } else {
        expect(await find(ui, { text: /^BiteQ$/ })).toBeDefined()
        expect(await find(ui, { text: /^ - Bite Size Coding Questions$/ })).toBeDefined()
      }

      await $.turn.start({ text: 'fix the bug', turnId: 't1' })
      expect(await find(ui, { text: /\[cs\]/ })).toBeDefined()   // the default bank

      await click(ui, OPEN(ui, 'a'))
      expect(await find(ui, { text: /Correct!|Not quite\./ })).toBeDefined()
      expect(await find(ui, { text: /streak \d+ · best \d+/ })).toBeDefined()
      expect(await find(ui, { type: 'Button', text: ANSWERED(ui) })).toBeDefined()

      await $.turn.complete(DONE)

      // Claude is done: Next rests instead of serving (the terminal's Next is the hint bar's "next")
      await click(ui, ui.surface === 'terminal' ? /^next$/ : /^Next$/)
      expect(await find(ui, { text: RESTING })).toBeDefined()
      expect(await find(ui, { text: /^Pick / })).toBeUndefined()

      // Claude works again: the next question is served
      await $.turn.start({ text: 'more', turnId: 't2' })
      expect(await find(ui, { type: 'Button', text: ui.surface === 'terminal' ? /^skip$/ : /^Skip$/ })).toBeDefined()
    })
  }
})

describe('when Claude is done', () => {
  const RESTING_RE = RESTING
  async function done($: Engine, on: On, surface: 'terminal' | 'desktop', shared?: Record<string, unknown>, banks = BANKS) {
    world(on, banks, surface, shared)
    await $.session.start({ cwd: '.', surface, isInteractive: true })
    const ui: Drawing = await $.ui.mount({ plugin: 'biteq', surface, ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    await $.turn.complete(DONE)
    return ui
  }
  const title = async (ui: Drawing) => (await find(ui, { text: /^Pick / }))?.text
  const NEXT = (ui: Drawing) => (ui.surface === 'terminal' ? /^next$/ : /^Next$/)
  const SKIP = (ui: Drawing) => (ui.surface === 'terminal' ? /^skip$/ : /^Skip$/)
  const run = async ($: Engine, args: string) =>
    String(((await $.prompt.submit({ text: `/biteq ${args}`, wait: false } as never)) as { drop?: string }).drop)

  for (const surface of ['terminal', 'desktop'] as const) {
    test(`${surface}: the question on screen can still be answered, with its explanation`, async ($, on) => {
      const ui = await done($, on, surface)
      expect(await title(ui)).toBeDefined()
      await click(ui, OPEN(ui, 'a'))
      expect(await find(ui, { text: /Correct!|Not quite\./ })).toBeDefined()
      expect(await find(ui, { text: /^because$/ })).toBeDefined()   // the explanation
    })

    test(`${surface}: Next and Skip show the resting message, with no question, answers or Next`, async ($, on) => {
      const ui = await done($, on, surface)
      await click(ui, SKIP(ui))   // skip an unanswered question: rests too
      expect(await find(ui, { text: RESTING_RE })).toBeDefined()
      expect(await title(ui)).toBeUndefined()
      expect(await find(ui, { type: 'Button', text: OPEN(ui, 'a') })).toBeUndefined()
      expect(await find(ui, { type: 'Button', text: NEXT(ui) })).toBeUndefined()
      if (surface === 'terminal') {
        expect((await find(ui, { type: 'Button', text: /^serve next$/ }))?.props.hotkey).toBe('n')
        expect((await find(ui, { type: 'Button', text: /^always serve$/ }))?.props.hotkey).toBe('s')
      } else {
        expect(await find(ui, { type: 'Button', text: /^Serve next question$/ })).toBeDefined()
        expect(await find(ui, { type: 'Button', text: /^Always serve, even when Claude is done$/ })).toBeDefined()
      }
    })

    test(`${surface}: "serve next question" serves one now; the setting stays on`, async ($, on) => {
      // a third question, so the second Next rests rather than saying every question is answered
      const more = { id: 'cs-c', prompt: 'Pick m', options: ['m1', 'm2'], answer: 0, explanation: 'because' }
      const ui = await done($, on, surface, undefined, { ...BANKS, cs: [...BANKS.cs!, more] })
      await click(ui, OPEN(ui, 'a'))
      await click(ui, NEXT(ui))
      await click(ui, surface === 'terminal' ? /^serve next$/ : /^Serve next question$/)
      expect(await title(ui)).toBeDefined()
      await click(ui, OPEN(ui, 'a'))
      await click(ui, NEXT(ui))
      expect(await find(ui, { text: RESTING_RE })).toBeDefined()   // still pausing
    })
  }

  test('"always serve" is remembered, and /biteq pause on turns pausing back on', async ($, on) => {
    const shared: Record<string, unknown> = {}
    const ui = await done($, on, 'desktop', shared)
    await click(ui, SKIP(ui))
    await click(ui, /^Always serve, even when Claude is done$/)
    expect(await title(ui)).toBeDefined()
    expect(shared.config).toMatchObject({ pauseWhenDone: false })   // in the store: every session, every restart
    await click(ui, OPEN(ui, 'a'))
    await click(ui, NEXT(ui))
    expect(await title(ui)).toBeDefined()   // keeps serving while Claude is done
    expect(await run($, 'doctor')).toContain('when done     keep serving')

    expect(await run($, 'pause on')).toContain('pause when Claude is done: on')
    expect(shared.config).toMatchObject({ pauseWhenDone: true })
    await click(ui, SKIP(ui))
    expect(await find(ui, { text: RESTING_RE })).toBeDefined()
    expect(await run($, 'pause maybe')).toBe('usage: /biteq pause on|off')
  })

  test('desktop: the actions are framed so they read as buttons', async ($, on) => {
    const ui = await done($, on, 'desktop')
    const drawn = JSON.stringify(await ui.drawn({ in: 'quiz' } as never))
    // Skip and Close under a question, then Serve / Always serve while resting: each in a rounded frame
    const framed = (key: string) => new RegExp(`"key":"frame:${key}","borderStyle":"round"`)
    expect(drawn).toMatch(framed('skip:[^"]+'))
    expect(drawn).toMatch(framed('close'))
    await click(ui, SKIP(ui))
    const resting = JSON.stringify(await ui.drawn({ in: 'quiz' } as never))
    expect(resting).toMatch(new RegExp(`"key":"frame:serve","borderStyle":"round","borderColor":"claude"`))
    expect(resting).toMatch(new RegExp(`"key":"frame:always","borderStyle":"round","borderColor":"subtle"`))
  })

  test('reopening the pane with /biteq keeps resting', async ($, on) => {
    const ui = await done($, on, 'desktop')
    await click(ui, SKIP(ui))
    await run($, '')
    expect(await find(ui, { text: RESTING_RE })).toBeDefined()
    expect(await title(ui)).toBeUndefined()
  })
})

describe('terminal hint bar', () => {
  async function terminal($: Engine, on: On) {
    const { opened } = world(on, BANKS, 'terminal')
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'terminal', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    return { ui, opened }
  }
  const title = async (ui: Drawing) => (await find(ui, { text: /^Pick / }))?.text
  const hint = async (ui: Drawing, label: string) => find(ui, { type: 'Button', text: new RegExp(`^${label}$`) })

  test('next/skip and close are dim hotkey buttons (n, q) at the bottom', async ($, on) => {
    const { ui } = await terminal($, on)
    const skip = await hint(ui, 'skip')
    const close = await hint(ui, 'close')
    expect(skip?.props).toMatchObject({ hotkey: 'n', plain: true, dimColor: true })
    expect(close?.props).toMatchObject({ hotkey: 'q', plain: true, dimColor: true })
    expect(await hint(ui, 'Next')).toBeUndefined()
    expect(await hint(ui, 'Close')).toBeUndefined()
    // the bar is the pane's last row
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn.lastIndexOf('"close"')).toBeGreaterThan(drawn.lastIndexOf('Pick '))
  })

  test('the arrow keys and Tab never land on the hint bar', async ($, on) => {
    const { ui } = await terminal($, on)
    const answerKey = await keyOf(ui, OPEN(ui, 'a'))
    for (const label of ['skip', 'close']) {
      const key = (await hint(ui, label))?.key ?? ''
      const res = await $.ui.focus({ requestId: 'biteq', key } as never)
      expect(res).toMatchObject({ deny: expect.stringContaining('hint bar') } as never)
    }
    const ok = await $.ui.focus({ requestId: 'biteq', key: answerKey } as never)
    expect((ok as { deny?: string }).deny ?? '').not.toContain('hint bar')
  })

  test('n skips, then after an answer reads "next"; q closes and the pane stays closed', async ($, on) => {
    const { ui, opened } = await terminal($, on)
    const before = await title(ui)
    await click(ui, /^skip$/)
    expect(await title(ui)).not.toBe(before)
    await click(ui, OPEN(ui, 'a'))
    expect(await hint(ui, 'next')).toBeDefined()
    await click(ui, /^close$/)
    const count = opened.length
    await $.turn.complete(DONE)
    await $.turn.start({ text: 'again', turnId: 't2' })
    expect(opened.length).toBe(count)   // dismissed: no reopen
  })

  test('after an answer the bar shows "⏎ next"; n still moves on but is not shown', async ($, on) => {
    const { ui } = await terminal($, on)
    await click(ui, OPEN(ui, 'a'))
    expect(await find(ui, { type: 'Text', text: /^⏎ next$/ })).toBeDefined()
    // n's button is drawn (so the hotkey works) inside a zero-size, clipped box
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn).toMatch(/"position":"absolute","width":0,"height":0,"overflow":"hidden"\},"children":\[\{"type":"Button","props":\{"key":"next:[^"]+","label":"next","hotkey":"n"/)
    const before = await title(ui)
    await click(ui, /^next$/)   // what the n hotkey presses
    expect(await title(ui)).not.toBe(before)
  })

  test('Enter on an answered option moves on (terminal)', async ($, on) => {
    const { ui } = await terminal($, on)
    const before = await title(ui)
    const a = await keyOf(ui, OPEN(ui, 'a'))
    await ui.press({ key: a })   // answer
    await ui.press({ key: a })   // Enter again on the same, now answered, option
    expect(await title(ui)).not.toBe(before)
    expect(await find(ui, { text: /^n: skip|skip$/ })).toBeDefined()
  })

  test('desktop: pressing an answered option does not move on', async ($, on) => {
    world(on, BANKS, 'desktop')
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    const before = await title(ui)
    const a = await keyOf(ui, OPTION('a', 'desktop'))
    await ui.press({ key: a, ...inQuiz(ui) })
    await ui.press({ key: a, ...inQuiz(ui) })
    expect(await title(ui)).toBe(before)
  })

  test('a docked pane fills its rows, so the bar sits on the last one', async ($, on) => {
    const { ui } = await terminal($, on)
    expect(JSON.stringify(await ui.drawn())).toContain(`"minHeight":${PANE.props.scroll.bodyRows}`)
  })

  test('an inline pane fits its content (filling it would push the prompt down)', async ($, on) => {
    world(on, BANKS, 'terminal')
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'terminal', ...PANE, props: { ...PANE.props, placement: 'inline' } })
    await $.turn.start({ text: 'go', turnId: 't1' })
    expect(JSON.stringify(await ui.drawn())).not.toContain('"minHeight"')
  })

  test('desktop keeps its Next/Skip/Close buttons', async ($, on) => {
    world(on, BANKS, 'desktop')
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    expect(await find(ui, { type: 'Button', text: /^Skip$/ })).toBeDefined()
    expect(await find(ui, { type: 'Button', text: /^Close$/ })).toBeDefined()
  })
})

describe('presses', () => {
  test('two clicks on one drawing record one answer', async ($, on) => {
    world(on, BANKS, 'desktop')
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    const [a, b] = [await keyOf(ui, OPTION('a', 'desktop')), await keyOf(ui, OPTION('b', 'desktop'))]
    await Promise.allSettled([ui.press({ key: a, ...inQuiz(ui) }), ui.press({ key: b, ...inQuiz(ui) })])
    expect(await find(ui, { text: /streak \d+ · best \d+/ })).toBeDefined()
    const stats = String(((await $.prompt.submit({ text: '/biteq stats', wait: false } as never)) as { drop?: string }).drop)
    expect(stats).toContain('answered      1')   // once, not twice
  })

  test('hotkeys only in the terminal; the desktop keeps its keys in the message box', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    await $.turn.start({ text: 'go', turnId: 't1' })
    const term = await $.ui.mount({ plugin: 'biteq', surface: 'terminal', ...PANE })
    expect((await term.find({ type: 'Button', text: OPEN(term, 'a') }))?.props.hotkey).toBe('a')
    const desk = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    expect((await find(desk, { type: 'Button', text: OPTION('a', 'desktop') }))?.props.hotkey).toBeUndefined()
    expect((await find(desk, { type: 'Button', text: /^Skip$/ }))?.props.hotkey).toBeUndefined()
  })

  test('desktop: a wait asks the pane for focus; boot does not', async ($, on) => {
    const { opened } = world(on, BANKS, 'desktop')
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    expect(opened.some(o => o.focus)).toBe(false)
    await $.turn.start({ text: 'go', turnId: 't1' })
    expect(opened.some(o => o.focus === true)).toBe(true)
  })

  test('terminal: a wait does not take the keyboard', async ($, on) => {
    const { opened } = world(on, BANKS, 'terminal')
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    await $.turn.start({ text: 'go', turnId: 't1' })
    expect(opened.some(o => o.focus)).toBe(false)
  })

  test('desktop: answering keeps option Buttons and still records', async ($, on) => {
    world(on, BANKS, 'desktop')
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    await click(ui, OPTION('a', 'desktop'))
    expect(await find(ui, { type: 'Button', text: ANSWERED(ui) })).toBeDefined()
    expect(await find(ui, { type: 'Button', text: /^Next$/ })).toBeDefined()
    expect(await find(ui, { text: /streak \d+ · best \d+/ })).toBeDefined()
  })

  test('terminal: an unfocused pane dims the quiz; focus restores it', async ($, on) => {
    world(on, BANKS, 'terminal')
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'terminal', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    const title = () => find(ui, { type: 'Text', text: /^BiteQ$/ })
    const option = OPEN(ui, 'a')
    expect((await title())?.props.dimColor).toBeUndefined()

    await ui.redraw({ ...PANE.props, isFocused: false })
    expect((await title())?.props.dimColor).toBe(true)
    expect((await find(ui, { type: 'Text', text: /^Pick / }))?.props.dimColor).toBe(true)
    expect((await find(ui, { type: 'Button', text: option }))?.props.dimColor).toBe(true)
    expect((await find(ui, { type: 'Button', text: /^skip$/ }))?.props.dimColor).toBe(true)   // the hint bar's

    await ui.redraw({ ...PANE.props, isFocused: true })
    expect((await title())?.props.dimColor).toBeUndefined()
  })

  test('desktop: losing focus leaves the quiz as it was', async ($, on) => {
    world(on, BANKS, 'desktop')
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    const option = OPEN(ui, 'a')
    expect(await find(ui, { text: /^BiteQ$/ })).toBeUndefined()

    await ui.redraw({ ...PANE.props, isFocused: false })
    expect((await find(ui, { type: 'Text', text: /^Pick / }))?.props.dimColor).toBeUndefined()
    expect((await find(ui, { type: 'Button', text: option }))?.props.dimColor).toBeUndefined()
    expect((await find(ui, { type: 'Button', text: /^Skip$/ }))?.props.dimColor).toBeUndefined()
  })

  test('terminal: BiteQ and a matched streak are #F58700 and bold; 0–0 stays dim', async ($, on) => {
    world(on, BANKS, 'terminal')
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'terminal', ...PANE })
    const title = () => find(ui, { type: 'Text', text: /^BiteQ$/ })
    const side = (text: RegExp) => find(ui, { type: 'Text', text })
    expect((await title())?.props.color).toBe('#F58700')
    expect((await title())?.props.bold).toBe(true)
    expect((await side(/^streak 0$/))?.props.color).toBeUndefined()
    expect((await side(/^streak 0$/))?.props.dimColor).toBe(true)
    expect((await side(/^best 0$/))?.props.dimColor).toBe(true)

    await $.turn.start({ text: 'go', turnId: 't1' })
    await click(ui, OPEN(ui, 'a'))
    expect((await side(/^streak 1$/))?.props.color).toBe('#F58700')
    expect((await side(/^streak 1$/))?.props.bold).toBe(true)
    expect((await side(/^best 1$/))?.props.color).toBe('#F58700')
    expect((await side(/^best 1$/))?.props.bold).toBe(true)
  })
})

describe('serving order', () => {
  const FINISHED = /^You've cleared every question in your banks:$/

  async function answerAll(ui: Drawing, n: number): Promise<string[]> {
    const served: string[] = []
    for (let i = 0; i < n; i++) {
      served.push((await find(ui, { text: /^Pick / }))?.text ?? '?')
      await click(ui, OPEN(ui, 'a'))   // every fixture answer is the first option, so nothing comes back as missed
      await click(ui, /^Next$/)
    }
    return served
  }

  test('only the selected banks are served, mixed; then the pane says they are all answered', async ($, on) => {
    world(on, BANKS, 'desktop')
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    expect(await find(ui, { text: /^\[cs\] $/ })).toBeDefined()   // served at boot, from the default bank
    await $.prompt.submit({ text: '/biteq --lang ruby,js', wait: false } as never)
    expect(await find(ui, { text: /^\[cs\] $/ })).toBeUndefined()   // unanswered, and no longer selected: replaced
    await $.turn.start({ text: 'go', turnId: 't1' })
    const served = await answerAll(ui, 3)
    // every selected question once; cs and python (not selected) never
    expect([...served].sort()).toEqual(['Pick j', 'Pick r', 'Pick s'])
    // congratulates, lists the banks answered, and says how to go on: on desktop by clicking
    expect(await find(ui, { text: /^Congratulations!$/ })).toBeDefined()
    expect(await find(ui, { text: /^ 3 of 3 in one shot\.$/ })).toBeDefined()
    expect(await find(ui, { text: FINISHED })).toBeDefined()
    expect((await find(ui, { text: /✓ ruby\s+one-shot\s+2\/2$/ }))?.props).toMatchObject({ bold: true, color: '#F58700' })
    expect(await find(ui, { text: /✓ js\s+one-shot\s+1\/1$/ })).toBeDefined()
    expect(await find(ui, { text: /cs|python/ })).toBeUndefined()
    expect(await find(ui, { text: /^Click Start over to go again, or Switch Q banks to choose other banks\.$/ })).toBeDefined()
    expect(await find(ui, { text: /--lang|Press n/ })).toBeUndefined()
    expect(await find(ui, { text: /^Pick / })).toBeUndefined()
    expect(await find(ui, { type: 'Button', text: /^Practice now$/ })).toBeUndefined()
  })

  test('the banks are mixed: a big bank does not crowd out a small one', async ($, on) => {
    const big = Array.from({ length: 40 }, (_, i) =>
      ({ id: `ruby-${i}`, prompt: `Pick r${i}`, options: ['r1', 'r2'], answer: 0, explanation: 'because' }))
    world(on, { ruby: big, js: BANKS.js! }, 'desktop')
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    await $.prompt.submit({ text: '/biteq --lang ruby,js', wait: false } as never)
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    // picking the bank first serves js about half the time; by question, 1 in 41.
    // The odds of 10 Ruby questions in a row are 1 in 1024.
    expect(await answerAll(ui, 10)).toContain('Pick j')
  })

  test('Start over serves the selected banks again, and keeps the others\' progress', async ($, on) => {
    const shared: Record<string, unknown> = { stats: { seen: ['python-a'] } }
    world(on, BANKS, 'desktop', shared)
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    await answerAll(ui, 2)
    expect(await find(ui, { text: FINISHED })).toBeDefined()
    await click(ui, /^Start over$/)
    expect(await find(ui, { text: /^\[cs\] $/ })).toBeDefined()
    expect((shared.stats as { seen: string[] }).seen).toEqual(['python-a'])
  })

  test('terminal: the hint bar offers "start over" (n)', async ($, on) => {
    world(on, BANKS, 'terminal')
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'terminal', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    for (let i = 0; i < 2; i++) {
      await click(ui, OPEN(ui, 'a'))
      await click(ui, /^next$/)
    }
    expect(await find(ui, { text: FINISHED })).toBeDefined()
    expect((await find(ui, { type: 'Button', text: /^start over$/ }))?.props).toMatchObject({ hotkey: 'n', plain: true })
    expect(await find(ui, { text: /^Press n to start over, or z to choose other banks\.$/ })).toBeDefined()
    expect(await find(ui, { text: /✓ cs\s+one-shot\s+2\/2$/ })).toBeDefined()
    expect(await find(ui, { text: /in one shot/ })).toBeUndefined()   // one bank: no total
    await click(ui, /^start over$/)
    expect(await find(ui, { text: /^\[cs\] $/ })).toBeDefined()
  })

  test('a skipped question is not counted as answered: it comes back last', async ($, on) => {
    world(on, BANKS, 'desktop')
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    const skipped = (await find(ui, { text: /^Pick / }))?.text
    await click(ui, /^Skip$/)
    await answerAll(ui, 1)
    expect((await find(ui, { text: /^Pick / }))?.text).toBe(skipped)
  })

  test('a missed question comes back once the rest are answered; finished only when it is right', async ($, on) => {
    const shared: Record<string, unknown> = {}
    world(on, BANKS, 'desktop', shared)
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    const missed = (await find(ui, { text: /^Pick / }))?.text
    await click(ui, OPEN(ui, 'b'))   // every fixture answer is a, so b is wrong
    await click(ui, /^Next$/)
    expect((await find(ui, { text: /^Pick / }))?.text).not.toBe(missed)   // not straight back
    await answerAll(ui, 1)
    expect(await find(ui, { text: FINISHED })).toBeUndefined()
    expect((await find(ui, { text: /^Pick / }))?.text).toBe(missed)
    await answerAll(ui, 1)
    expect(await find(ui, { text: FINISHED })).toBeDefined()
    expect(await find(ui, { text: /✓ cs\s+one-shot\s+1\/2$/ })).toBeDefined()
  })

  test('one-shot counts only the first answer ever: Start over and earlier answers never add to it', async ($, on) => {
    // cs-a was answered (and missed) before one-shot was tracked
    const shared: Record<string, unknown> = { stats: { seen: ['cs-a'], wrong: ['cs-a'] } }
    world(on, BANKS, 'desktop', shared)
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    await answerAll(ui, 2)   // cs-b, then cs-a (missed, so it comes back), both right
    expect(await find(ui, { text: /✓ cs\s+one-shot\s+1\/2$/ })).toBeDefined()
    await click(ui, /^Start over$/)
    await answerAll(ui, 2)   // both right again: repeats don't count
    expect(await find(ui, { text: /✓ cs\s+one-shot\s+1\/2$/ })).toBeDefined()
    expect((shared.stats as { one_shot: unknown }).one_shot).toEqual({ 'cs-b': true, 'cs-a': false })
  })
})

describe('bank screen', () => {
  const ROW = (on: boolean, lang: string) => new RegExp(`^\\[${on ? 'x' : ' '}\\] ${lang} `)
  async function pane($: Engine, on: On, surface: 'terminal' | 'desktop', shared: Record<string, unknown> = {}) {
    world(on, BANKS, surface, shared)
    await $.session.start({ cwd: '.', surface, isInteractive: true })
    const ui: Drawing = await $.ui.mount({ plugin: 'biteq', surface, ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    return ui
  }
  const BANKS_BUTTON = (ui: Drawing) => (ui.surface === 'terminal' ? /^banks$/ : /^Switch Q banks$/)
  const DONE_BUTTON = (ui: Drawing) => (ui.surface === 'terminal' ? /^done$/ : /^Done$/)

  test('terminal: z opens it over the question; each bank is a digit toggle; z goes back', async ($, on) => {
    const ui = await pane($, on, 'terminal')
    const question = (await find(ui, { text: /^Pick / }))?.text
    expect((await find(ui, { type: 'Button', text: /^banks$/ }))?.props).toMatchObject({ hotkey: 'z', plain: true })
    await click(ui, /^banks$/)
    expect(await find(ui, { text: /^Pick / })).toBeUndefined()
    // the selection first, then A-Z; banks with no questions (go) aren't listed
    expect((await find(ui, { type: 'Button', text: ROW(true, 'cs') }))?.props).toMatchObject({ hotkey: '1' })
    expect((await find(ui, { type: 'Button', text: ROW(false, 'js') }))?.props).toMatchObject({ hotkey: '2' })
    expect((await find(ui, { type: 'Button', text: ROW(false, 'ruby') }))?.props).toMatchObject({ hotkey: '4' })
    expect(await find(ui, { type: 'Button', text: /go/ })).toBeUndefined()
    expect((await find(ui, { type: 'Button', text: /^done$/ }))?.props).toMatchObject({ hotkey: 'z' })
    await click(ui, /^done$/)
    expect((await find(ui, { text: /^Pick / }))?.text).toBe(question)   // the same question, still unanswered
  })

  for (const [surface, hint] of [['terminal', /^No questions in the selected banks\. Press z to choose other banks\.$/],
    ['desktop', /^No questions in the selected banks\. Click Switch Q banks to choose other banks\.$/]] as const) {
    test(`${surface}: remembered banks with no questions point to the bank screen`, async ($, on) => {
      world(on, BANKS, surface, { config: { langs: ['go'] } })   // go was emptied since it was chosen
      await $.session.start({ cwd: '.', surface, isInteractive: true })
      const ui = await $.ui.mount({ plugin: 'biteq', surface, ...PANE })
      expect(await find(ui, { text: hint })).toBeDefined()
      expect(await find(ui, { text: /\/biteq/ })).toBeUndefined()
      await click(ui, surface === 'terminal' ? /^banks$/ : /^Switch Q banks$/)
      expect(await find(ui, { text: /^Choose the banks to practise/ })).toBeDefined()
    })
  }

  test('toggles are saved at once, and the last bank cannot be unchecked', async ($, on) => {
    const shared: Record<string, unknown> = {}
    const ui = await pane($, on, 'terminal', shared)
    await click(ui, /^banks$/)
    await click(ui, ROW(false, 'ruby'))
    expect(await find(ui, { type: 'Button', text: ROW(true, 'ruby') })).toBeDefined()
    expect(shared.config).toMatchObject({ langs: ['cs', 'ruby'] })
    await click(ui, ROW(true, 'cs'))
    await click(ui, ROW(true, 'ruby'))   // the last one: stays checked
    expect(await find(ui, { type: 'Button', text: ROW(true, 'ruby') })).toBeDefined()
    expect(shared.config).toMatchObject({ langs: ['ruby'] })
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    test(`${surface}: going back replaces an unanswered question from an unchecked bank`, async ($, on) => {
      const ui = await pane($, on, surface)
      await click(ui, BANKS_BUTTON(ui))
      await click(ui, ROW(false, 'js'))
      await click(ui, ROW(true, 'cs'))
      await click(ui, DONE_BUTTON(ui))
      expect(await find(ui, { text: /^\[js\] $/ })).toBeDefined()
    })
  }

  test('an answered question stays, so its explanation can still be read', async ($, on) => {
    const ui = await pane($, on, 'desktop')
    await click(ui, OPEN(ui, 'a'))
    await click(ui, /^Switch Q banks$/)
    await click(ui, ROW(false, 'js'))
    await click(ui, ROW(true, 'cs'))
    await click(ui, /^Done$/)
    expect(await find(ui, { text: /^\[cs\] $/ })).toBeDefined()
    expect(await find(ui, { text: /^because$/ })).toBeDefined()
    await click(ui, /^Next$/)
    expect(await find(ui, { text: /^\[js\] $/ })).toBeDefined()
  })

  test('desktop: a repeated click on a toggle does not undo it; quiz clicks are ignored meanwhile', async ($, on) => {
    const ui = await pane($, on, 'desktop')
    const desktop = ui as Mounted<'desktop', 'Pane'>   // only a desktop drawing has a Client to post from
    const answer = await keyOf(ui, OPEN(ui, 'a'))
    await click(ui, /^Switch Q banks$/)
    expect(await find(ui, { type: 'Button', text: /^Skip$/ })).toBeUndefined()
    // clicks as the desktop module sends them (surface.post), so a key from an old drawing still arrives
    const check = await keyOf(ui, ROW(false, 'ruby'))
    await desktop.post({ key: check }, { in: 'quiz' })
    await desktop.post({ key: check }, { in: 'quiz' })   // from the drawing before the first took effect
    expect(await find(ui, { type: 'Button', text: ROW(true, 'ruby') })).toBeDefined()
    await desktop.post({ key: answer }, { in: 'quiz' })   // the question's option, from before the bank screen
    await click(ui, /^Done$/)
    expect(await find(ui, { text: /Correct!|Not quite\./ })).toBeUndefined()
  })
})

describe('several sessions', () => {
  test("Next doesn't serve a question another session already answered", async ($, on) => {
    const shared: Record<string, unknown> = {}
    world(on, BANKS, 'desktop', shared)
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    const mine = (await find(ui, { text: /^Pick / }))?.text
    await click(ui, OPEN(ui, 'a'))
    // meanwhile another session answers the other cs question
    const stats = shared.stats as { seen: string[] }
    const other = mine === 'Pick c' ? 'cs-b' : 'cs-a'
    shared.stats = { ...stats, seen: [...stats.seen, other], answered: 2 }
    await click(ui, /^Next$/)
    expect(await find(ui, { text: /^Congratulations!$/ })).toBeDefined()   // both are done
  })
})

describe('claude events', () => {
  test('a subagent finishing does not end the main turn', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'terminal', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    await $.turn.complete({ ...DONE, turnId: 't2', agentId: 'sub' })
    // still thinking, so Next serves the next question instead of resting
    await click(ui, /^skip$/)
    expect(await find(ui, { text: RESTING })).toBeUndefined()
    expect(await find(ui, { text: /^Pick / })).toBeDefined()
  })
})

describe('/biteq commands', () => {
  const run = async ($: Engine, args: string) =>
    String(((await $.prompt.submit({ text: `/biteq ${args}`, wait: false } as never)) as { drop?: string }).drop)

  for (const surface of ['desktop', 'terminal'] as const) {
    test(`${surface}: typing /biteq opens the pane and never reaches Claude`, async ($, on) => {
      world(on, BANKS, surface)
      await $.session.start({ cwd: '.', surface, isInteractive: true })
      const res = await $.prompt.submit({ text: '/biteq', wait: false } as never)
      expect(res).toEqual({ drop: expect.stringContaining('serving cs 2 (2 questions)') } as never)
      const wrapped = await $.prompt.submit({ text: '<system-reminder>\nnote\n</system-reminder>\n/biteq', wait: false } as never)
      expect(wrapped).toEqual({ drop: expect.stringContaining('questions') } as never)
      const plain = await $.prompt.submit({ text: 'fix /biteq-related bug', wait: false } as never)
      expect(plain).toEqual({ text: 'fix /biteq-related bug' } as never)
    })
  }

  test('--lang is validated and remembered; langs marks the selection', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    expect(await run($, '--lang cobol')).toContain('unknown language cobol')
    expect(await run($, '--lang go')).toContain('no questions in go')
    expect(await run($, 'doctor')).toContain('selected      cs')   // an empty selection isn't remembered
    expect(await run($, '--lang python,js')).toContain('serving python 2, js 1 (3 questions)')
    const langs = await run($, 'langs')
    expect(langs).toMatch(/js\s+1 questions\s+<- selected/)
    expect(langs).toMatch(/ruby\s+2 questions$/m)
    // the selected banks first, then the rest A-Z
    expect(langs.split('\n').map(l => l.split(/\s+/)[0])).toEqual(['python', 'js', 'cs', 'go', 'ruby'])
  })

  test('stats, check, doctor, reset', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'terminal', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    await click(ui, OPEN(ui, 'a'))

    const stats = await run($, 'stats')
    expect(stats).toContain('answered      1')
    expect(stats).toMatch(/^ {13}correct {3}one-shot$/m)
    expect(stats).toMatch(/^  cs {9}1\/1 {7}1\/2$/m)
    expect(stats).toContain('AI waits      1  (you practiced during 100% of them)')
    expect(await run($, 'check')).toBe('7 questions in 5 banks: cs 2, go 0, js 1, python 2, ruby 2')
    expect(await run($, 'doctor')).toContain('selected      cs')
    expect(await run($, 'reset --all')).toContain('removed: status, stats, config')
    const cleared = await run($, 'stats')
    expect(cleared).toContain('answered      0')
    expect(cleared).not.toContain('one-shot')
  })

  test('check reports broken banks', async ($, on) => {
    world(on, { python: [{ id: 'wrong-id', prompt: 'p', options: ['x'], answer: 3, explanation: 'e' }] })
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const out = await run($, 'check')
    expect(out).toContain("ERROR wrong-id: id must start with 'python-'")
    expect(out).toContain('ERROR wrong-id: needs 2-4 options')
    expect(out).toContain('ERROR wrong-id: answer out of range')
  })

  test('check requires a practicality from 1 to 10', async ($, on) => {
    const q = { prompt: 'p', options: ['x', 'y'], answer: 0, explanation: 'e' }
    world(on, { python: [
      { id: 'python-ok', practicality: 10, ...q },
      { id: 'python-none', ...q },
      { id: 'python-zero', practicality: 0, ...q },
      { id: 'python-half', practicality: 2.5, ...q },
    ] })
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const out = await run($, 'check')
    expect(out).not.toContain('python-ok')
    expect(out).toContain('ERROR python-none: missing practicality')
    expect(out).toContain('ERROR python-zero: practicality must be a whole number from 1 to 10')
    expect(out).toContain('ERROR python-half: practicality must be a whole number from 1 to 10')
  })
})

describe('telemetry', () => {
  const run = async ($: Engine, args: string) =>
    String(((await $.prompt.submit({ text: `/biteq ${args}`, wait: false } as never)) as { drop?: string }).drop)

  test('a checkout load does not report an open or an answer', async ($, on) => {
    const fetched: string[] = []
    world(on)
    on('http.fetch', ($, e) => {
      fetched.push(e.url)
      return { value: { status: 200, ok: true, headers: {}, text: '' } }
    })
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'terminal', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    await click(ui, OPEN(ui, 'a'))
    expect(fetched).toEqual([])
  })

  test('debug on records the Claude event and a checkout still does not report', async ($, on) => {
    const shared: Record<string, unknown> = {}
    const writes: string[] = []
    const fetched: string[] = []
    world(on, BANKS, 'desktop', shared, writes)
    on('http.fetch', ($, e) => {
      fetched.push(e.url)
      return { value: { status: 200, ok: true, headers: {}, text: '' } }
    })
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    expect(await run($, 'debug')).toContain('debug on')
    expect(shared.config).toMatchObject({ debug: true })
    expect(await run($, 'doctor')).toContain('debug log')
    expect(await run($, 'doctor')).not.toContain('off (/biteq debug)')
    await $.turn.start({ text: 'go', turnId: 't1' })
    const ui = await $.ui.mount({ plugin: 'biteq', surface: 'desktop', ...PANE })
    await click(ui, OPEN(ui, 'a'))
    expect(fetched).toEqual([])
    const logged = writes.join('\n')
    expect(logged).toContain('turn.start')
    expect(logged).toContain('No telemetry sent to /v1/opens because')
    expect(logged).toContain('No telemetry sent to /v1/answers because')
    expect(logged).toContain('the plugin path running outside of ~/.claude/plugins/cache')
    expect(await run($, 'debug off')).toBe('biteq: debug off')
    expect(shared.config).toMatchObject({ debug: false })
    expect(await run($, 'debug maybe')).toBe('usage: /biteq debug [on|off]')
  })

  test('reset --all leaves the telemetry userId', async ($, on) => {
    const shared: Record<string, unknown> = {
      userId: '6b9f1a20-0c3e-4d5f-8a7b-9c0d1e2f3a4b',
    }
    world(on, BANKS, 'terminal', shared)
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    expect(await run($, 'reset --all')).toContain('removed: status, stats, config')
    expect(shared.userId).toBe('6b9f1a20-0c3e-4d5f-8a7b-9c0d1e2f3a4b')
    expect(shared.stats).toBeUndefined()
    expect(shared.config).toBeUndefined()
  })
})
