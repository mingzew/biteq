// A placed pane, a recorded answer and a typed prompt, sent to the telemetry Lambda.
//
// This file does not touch `$`. register.ts puts sessionId and httpPost on `io`.
// A checkout (`--plugin-dir`, `claude plugin test`) is skipped, and so is any
// client other than the CLI or the desktop Code tab. A thrown POST or a non-2xx
// is dropped. The quiz does not wait on either report.
// Nothing is sent when CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC is set or the person ran
// `/biteq telemetry off`; that one switch covers opens, answers and the heartbeat.
// With /biteq debug on, a POST that is sent is also written to the debug log.
import { Client } from './client'
import { getTelemetry } from './config'
import { lastClaudeEvent, logEvent } from './debug'
import type { Io } from './io'
import { USER_ID } from './store'

// BiteqTelemetryUrl from BiteqTelemetryStack, no trailing slash.
// Paste the stack output here. Until then a report is dropped.
const ENDPOINT = 'https://tpcghrqsrjtjw6tdnzesnmr3eu0ewmpx.lambda-url.us-east-1.on.aws'

const INSTALLED = '.claude/plugins/cache/'

type Harness = 'terminal' | 'desktop'
type Path = '/v1/opens' | '/v1/answers' | '/v1/heartbeat'

type Payload = {
  userId: string
  sessionId: string
  harness: Harness
  pluginVersion: string
}

/** One open for this Claude session, after the pane is placed. Sets openReported only on a 2xx. */
export async function reportOpen(io: Io): Promise<void> {
  try {
    if (await send(io, '/v1/opens')) await io.set('openReported', () => true)
  } catch {
    // a dropped report must not break the pane
  }
}

/** One recorded answer. A repeat press never reaches here. */
export async function reportAnswer(io: Io): Promise<void> {
  try {
    await send(io, '/v1/answers')
  } catch {
    // a dropped report must not break the pane
  }
}

/**
 * One typed prompt: the heartbeat that says this session used Claude. It does not depend on the
 * pane, so it still goes when the pane was closed or never placed. Carries no prompt text.
 */
export async function reportPrompt(io: Io): Promise<void> {
  try {
    await send(io, '/v1/heartbeat')
  } catch {
    // a dropped report must not break the prompt
  }
}

const TRAFFIC_FLAG = 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC'

/** Why reporting is off: Claude Code's own setting, or the person's `/biteq telemetry off`. */
export type TelemetryState = { on: true } | { on: false; why: 'claude' | 'user' }

/**
 * Whether reports may be sent. Claude Code's CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC wins over the saved
 * choice and never changes it. The engine only refuses a plugin's request that carries `auth`, and ours
 * carries none, so this check is what honours the flag. Set means any value but empty, `0` or `false`.
 */
export async function telemetryState(io: Io): Promise<TelemetryState> {
  const flag = ((await io.env(TRAFFIC_FLAG)) ?? '').trim().toLowerCase()
  if (flag !== '' && flag !== '0' && flag !== 'false') return { on: false, why: 'claude' }
  if (!(await getTelemetry(io))) return { on: false, why: 'user' }
  return { on: true }
}

async function send(io: Io, path: Path): Promise<boolean> {
  // First, so nothing below runs while reporting is off: in particular no userId is created or stored.
  const state = await telemetryState(io)
  if (!state.on) {
    const reason = state.why === 'claude' ? `${TRAFFIC_FLAG} is set` : 'telemetry was turned off by the user'
    void logEvent(io, 'telemetry', `No telemetry sent to ${path} because ${reason}`)
    return false
  }
  if (!ENDPOINT || !io.pluginRoot.includes(INSTALLED)) {
    const reasons = [
      !ENDPOINT ? 'no endpoint is set' : '',
      io.pluginRoot.includes(INSTALLED) ? '' : `the plugin path running outside of ~/.claude/plugins/cache (${io.pluginRoot})`,
    ].filter(Boolean)
    void logEvent(io, 'telemetry', `No telemetry sent to ${path} because ${reasons.join(', and ')}`)
    return false
  }
  if (path === '/v1/opens' && (await io.get('openReported'))) return false
  const harness = await harnessOf(io)
  if (!harness) return false
  const body = await payload(io, harness)
  if (!body) return false
  const after = lastClaudeEvent()
  let ok = false
  try {
    const response = await io.httpPost(`${ENDPOINT}${path}`, JSON.stringify(body))
    ok = response.ok
    return ok
  } finally {
    void logEvent(io, 'telemetry', { endpoint: path, ok, after })
  }
}

async function harnessOf(io: Io): Promise<Harness | null> {
  const client = await io.client()
  if (client === Client.ClaudeCli || client === Client.ClaudeDesktop) return client
  return null
}

async function payload(io: Io, harness: Harness): Promise<Payload | null> {
  const id = await userId(io)
  const version = await pluginVersion(io)
  if (!version) return null
  return {
    userId: id,
    sessionId: await io.sessionId(),
    harness,
    pluginVersion: version,
  }
}

let creating: Promise<string> | undefined

async function userId(io: Io): Promise<string> {
  const stored = await io.storeGet(USER_ID)
  if (typeof stored === 'string' && stored.length > 0) return stored
  creating ??= createUserId(io).finally(() => {
    creating = undefined
  })
  return creating
}

async function createUserId(io: Io): Promise<string> {
  const id = crypto.randomUUID()
  await io.storeSet(USER_ID, id)
  return id
}

async function pluginVersion(io: Io): Promise<string | null> {
  const text = await io.read(`${io.pluginRoot}/.claude-plugin/plugin.json`)
  const version = (JSON.parse(text) as { version?: unknown }).version
  if (typeof version !== 'string' || version.length < 1 || version.length > 32) return null
  return version
}
