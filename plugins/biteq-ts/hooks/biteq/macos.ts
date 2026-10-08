// macOS helpers. STUBS: not implemented yet, nothing calls these.
//
// Same plan as the Python macos.py (osascript / open); they'll need a `run` command in Io.
// open_pane_window has no equivalent: Claude Code draws the pane itself.
import type { Io } from './io'

/** Show a macOS notification (osascript `display notification`). */
export async function notify(_io: Io, _title: string, _message: string): Promise<void> {
  throw new Error('notify is not implemented yet')
}

/** Bring an app forward, e.g. `open -a Claude` or `open -a Cursor`, when the AI is done. */
export async function focusApp(_io: Io, _name: string): Promise<void> {
  throw new Error('focusApp is not implemented yet')
}
