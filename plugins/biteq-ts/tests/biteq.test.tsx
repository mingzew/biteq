// Run: claude plugin test plugins/biteq-ts
//
// The engine's test kit: `$` is the engine's own, and the hooks a test registers with `on`
// stand for everything beneath the plugin (files, store, the session), answered from memory.
import type { On } from 'claude-code'
import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'

const BANKS: Record<string, unknown[]> = {
  python: [
    { id: 'python-a', title: 'A', prompt: 'Pick a', options: ['a1', 'a2'], answer: 0, explanation: 'because' },
    { id: 'python-b', title: 'B', prompt: 'Pick b', options: ['b1', 'b2'], answer: 1, explanation: 'because' },
  ],
  js: [{ id: 'js-a', title: 'J', prompt: 'Pick j', options: ['j1', 'j2'], answer: 0, explanation: 'because' }],
  ruby: [],
}

const PANE = {
  component: 'Pane',
  requestId: 'biteq',
  props: {
    title: 'biteq', isFocused: true, bodyColumns: 60, placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 }, view: {},
  },
} as const

const DONE = { reason: 'answer', answer: 'done', durationMs: 1, isAborted: false, turnId: 't1' } as const

// Everything beneath the plugin: question banks, an in-memory store, no env, and the engine's answers.
// Calls on $ answer { value } (or { deny }); events answer their own result.
function world(on: On, banks: Record<string, unknown[]> = BANKS, surface = 'terminal') {
  const opened: { focus?: true }[] = []
  const clock = mock.clock(on, { now: 1_000_000 })
  mock.store(on)
  mock.env(on, {})
  on('fs.exists', () => ({ value: true }))
  on('fs.list', () => ({
    value: Object.keys(banks).map(lang => ({ name: `${lang}.json`, kind: 'file', size: 1, mtimeMs: 0, isLink: false })),
  }) as never)
  on('fs.read', ($, e) => ({ value: JSON.stringify(banks[String(e.path).split('/').pop()!.replace('.json', '')] ?? []) }))
  on('fs.write', () => ({ value: undefined }))
  on('command.register', () => ({ value: undefined }) as never)
  on('ui.open', ($, e) => {
    opened.push(e)
    return { value: { isPlaced: true } }
  })
  on('ui.close', () => ({ value: undefined }) as never)
  on('ui.toast', () => ({ value: undefined }))
  on('session.version', () => ({ value: { version: '2.1.x', base: '2.1.x' } }) as never)
  on('session.surface', () => ({ value: surface }) as never)
  on('classic.Notification', () => ({}) as never)
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('command.run', () => ({ text: '' }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', ($, e) => ({ text: e.answer }))
  return { clock, opened }
}

// The pane's Buttons are keyed by action and question (`answer:0:python-a`, `next:python-a`),
// so tests find them by label and press the key they carry.
type Drawing = Mounted<'terminal' | 'desktop' | 'vscode', 'Pane'>
const OPTION = (letter: string) => new RegExp(`^${letter}\\) `)
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
      const ui = await $.ui.mount({ plugin: 'biteq-ts', surface, ...PANE })
      expect(await find(ui, { text: /^BiteQ$/ })).toBeDefined()
      expect(await find(ui, { text: /^ - Bite Sized Coding Questions$/ })).toBeDefined()
      expect(await find(ui, { text: /idle/ })).toBeDefined()

      await $.turn.start({ text: 'fix the bug', turnId: 't1' })
      expect(await find(ui, { text: /Claude is thinking/ })).toBeDefined()
      expect(await find(ui, { text: /\[python\]/ })).toBeDefined()   // default language, as in Python

      await click(ui, OPTION('a'))
      expect(await find(ui, { text: /Correct!|Not quite\./ })).toBeDefined()
      expect(await find(ui, { text: /streak \d+ · \d\/1/ })).toBeDefined()
      expect(await find(ui, { type: 'Button', text: /[✓✗] a\) / })).toBeDefined()

      await $.turn.complete(DONE)
      expect(await find(ui, { text: /Claude is done/ })).toBeDefined()

      await click(ui, /^Next$/)
      expect(await find(ui, { type: 'Button', text: /^Skip$/ })).toBeDefined()
    })
  }
})

describe('presses', () => {
  test('two clicks on one drawing record one answer', async ($, on) => {
    world(on, BANKS, 'desktop')
    await $.session.start({ cwd: '.', surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq-ts', surface: 'desktop', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    const [a, b] = [await keyOf(ui, OPTION('a')), await keyOf(ui, OPTION('b'))]
    await Promise.allSettled([ui.press({ key: a, ...inQuiz(ui) }), ui.press({ key: b, ...inQuiz(ui) })])
    expect(await find(ui, { text: /streak \d+ · \d\/1/ })).toBeDefined()   // answered once, not twice
  })

  test('hotkeys only in the terminal; the desktop keeps its keys in the message box', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    await $.turn.start({ text: 'go', turnId: 't1' })
    const term = await $.ui.mount({ plugin: 'biteq-ts', surface: 'terminal', ...PANE })
    expect((await term.find({ type: 'Button', text: OPTION('a') }))?.props.hotkey).toBe('a')
    const desk = await $.ui.mount({ plugin: 'biteq-ts', surface: 'desktop', ...PANE })
    expect((await find(desk, { type: 'Button', text: OPTION('a') }))?.props.hotkey).toBeUndefined()
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
    const ui = await $.ui.mount({ plugin: 'biteq-ts', surface: 'desktop', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    await click(ui, OPTION('a'))
    expect(await find(ui, { type: 'Button', text: /[✓✗] a\) / })).toBeDefined()
    expect(await find(ui, { type: 'Button', text: /^Next$/ })).toBeDefined()
    expect(await find(ui, { text: /streak \d+ · \d\/1/ })).toBeDefined()
  })

  test('the thinking timer counts while Claude works', async ($, on) => {
    const { clock } = world(on, BANKS, 'terminal')
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq-ts', surface: 'terminal', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    expect(await ui.find({ text: /thinking\s+0:00/ })).toBeDefined()
    await clock.advance(65_000)
    expect(await ui.find({ text: /thinking\s+1:05/ })).toBeDefined()
  })
})

describe('claude events', () => {
  test('AskUserQuestion shows waiting while it blocks, then thinking', async ($, on) => {
    world(on)
    let seen = ''
    let ui: Mounted<'terminal', 'Pane'> | undefined
    // the test's own hook stands in for the tool: read the banner while it "blocks"
    on('tool.call', { tool: 'AskUserQuestion' }, async () => {
      seen = (await ui?.find({ text: /needs your input/ }))?.text ?? ''
      return { result: { answers: {} } } as never
    })
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    ui = await $.ui.mount({ plugin: 'biteq-ts', surface: 'terminal', ...PANE })
    await $.turn.start({ text: 'ask me', turnId: 't1' })
    await $.tool.call({ tool: 'AskUserQuestion', input: { questions: [] } } as never)
    expect(seen).toMatch(/needs your input/)
    expect(await ui.find({ text: /Claude is thinking/ })).toBeDefined()
  })

  test('a subagent finishing does not end the main turn', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq-ts', surface: 'terminal', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    await $.turn.complete({ ...DONE, turnId: 't2', agentId: 'sub' })
    expect(await ui.find({ text: /Claude is thinking/ })).toBeDefined()
  })

  test('a permission prompt is waiting', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq-ts', surface: 'terminal', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    await $.classic.Notification({ message: 'ok?', notification_type: 'permission_prompt' } as never)
    expect(await ui.find({ text: /needs your input/ })).toBeDefined()
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
      expect(res).toEqual({ drop: expect.stringContaining('2 questions (python)') } as never)
      const wrapped = await $.prompt.submit({ text: '<system-reminder>\nnote\n</system-reminder>\n/biteq', wait: false } as never)
      expect(wrapped).toEqual({ drop: expect.stringContaining('questions') } as never)
      const plain = await $.prompt.submit({ text: 'fix /biteq-related bug', wait: false } as never)
      expect(plain).toEqual({ text: 'fix /biteq-related bug' } as never)
    })
  }

  test('--lang is validated and remembered; langs marks the selection', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    expect(await run($, '--lang go')).toContain('unknown language go')
    expect(await run($, '--lang ruby')).toContain('no questions for ruby')
    expect(await run($, '--lang python,js')).toContain('3 questions (python, js)')
    const langs = await run($, 'langs')
    expect(langs).toMatch(/js\s+1 questions\s+<- selected/)
    expect(langs).toMatch(/ruby\s+0 questions$/m)
  })

  test('stats, check, doctor, reset', async ($, on) => {
    world(on)
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'biteq-ts', surface: 'terminal', ...PANE })
    await $.turn.start({ text: 'go', turnId: 't1' })
    await click(ui, OPTION('a'))

    const stats = await run($, 'stats')
    expect(stats).toContain('answered      1')
    expect(stats).toContain('AI waits      1  (you practiced during 100% of them)')
    expect(await run($, 'check')).toBe('3 questions in 3 banks: js 1, python 2, ruby 0')
    expect(await run($, 'doctor')).toContain('selected      python')
    expect(await run($, 'reset --all')).toContain('removed: status, stats, config')
    expect(await run($, 'stats')).toContain('answered      0')
  })

  test('check reports broken banks', async ($, on) => {
    world(on, { python: [{ id: 'wrong-id', prompt: 'p', options: ['x'], answer: 3, explanation: 'e' }] })
    await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
    const out = await run($, 'check')
    expect(out).toContain("ERROR wrong-id: id must start with 'python-'")
    expect(out).toContain('ERROR wrong-id: needs 2-4 options')
    expect(out).toContain('ERROR wrong-id: answer out of range')
  })
})
