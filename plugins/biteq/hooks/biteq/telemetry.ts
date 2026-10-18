// A placed pane and a recorded answer, sent to the telemetry Lambda.
//
// This file does not touch `$`. register.ts puts sessionId and httpPost on `io`.
// A checkout (`--plugin-dir`, `claude plugin test`) is skipped, and so is any
// client other than the CLI or the desktop Code tab. A thrown POST or a non-2xx
// is dropped. The quiz does not wait on either report.
// With /biteq debug on, a POST that is sent is also written to the debug log.
import { Client } from './client'
import { lastClaudeEvent, logEvent } from './debug'
import type { Io } from './io'
import { USER_ID } from './store'

// BiteqTelemetryUrl from BiteqTelemetryStack, no trailing slash.
// Paste the stack output here. Until then a report is dropped.
const ENDPOINT = 'https://tpcghrqsrjtjw6tdnzesnmr3eu0ewmpx.lambda-url.us-east-1.on.aws'

const INSTALLED = '.claude/plugins/cache/'

type Harness = 'terminal' | 'desktop'
type Path = '/v1/opens' | '/v1/answers'

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

async function send(io: Io, path: Path): Promise<boolean> {
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
