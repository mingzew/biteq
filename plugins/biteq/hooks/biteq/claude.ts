// Claude Code adapter: engine event -> session status.
//
// parse(): null to ignore the event, else the status.
// register.ts hands it the engine's events (Claude Code CLI, desktop app, and the extension
// inside VS Code/Cursor all raise them) and sends what it returns to cli.signal.
import type { Status } from '../../types'

export type ClaudeEvent =
  | { event: 'turn.start' }                                        // settings hook: UserPromptSubmit
  | { event: 'turn.complete'; agentId?: string }                   // settings hook: Stop (but this also fires on interrupt)
  | { event: 'tool.before'; tool: string }                         // settings hook: PreToolUse
  | { event: 'tool.after'; tool: string }                          // settings hook: PostToolUse / PostToolUseFailure
  | { event: 'notification'; notification_type?: string }          // settings hook: Notification

// Tools that block until the person responds: "waiting" while they run
export const WAIT_TOOLS = ['AskUserQuestion', 'ExitPlanMode']
// Notification events: notification_type -> status (other types are ignored)
export const NOTIFICATION_STATUS: Record<string, Status> = {
  permission_prompt: 'waiting',
  idle_prompt: 'done',
}

export function parse(e: ClaudeEvent): Status | null {
  switch (e.event) {
    case 'turn.start':
      return 'thinking'
    case 'turn.complete':
      return e.agentId ? null : 'done'   // a subagent's turn ending is not Claude being done
    case 'tool.before':
      return WAIT_TOOLS.includes(e.tool) ? 'waiting' : null
    case 'tool.after':
      return 'thinking'   // resumes after a question, a plan decision or a permission prompt
    case 'notification':
      return NOTIFICATION_STATUS[e.notification_type ?? ''] ?? null
  }
}
