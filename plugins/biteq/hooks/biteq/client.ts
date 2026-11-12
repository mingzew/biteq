// Which supported Claude client draws the pane, and what that means for biteq.
//
// Code doesn't compare the engine's surface names ('terminal', 'desktop', ...). It reads the current
// client as a `Client` (toClient, io.client()) and asks about behaviour through its traits
// (traitsOf). Supporting another client is one enum member and one row in TRAITS.
//
// quiz-client.tsx can't use any of this at run time: the desktop app loads that file on its own,
// so it can't import values. It takes a ClientTraits object instead, which is plain data (the pane
// hook passes traitsOf(client), the desktop module gets it in its props).

/** The clients biteq supports. Values are the engine's surface names for them. */
export enum Client {
  ClaudeCli = 'terminal',       // the claude CLI
  ClaudeDesktop = 'desktop',    // the Claude desktop app's Code tab
}

/** The marks the quiz draws: beside the right answer and a wrong pick, and the Enter key in the hint bar. */
export type Glyphs = { right: string; wrong: string; enter: string }

const UNICODE_GLYPHS: Glyphs = { right: '✓', wrong: '✗', enter: '⏎' }

// A Windows console window (cmd, PowerShell) draws in Consolas or Lucida Console, which have no ✓ ✗ ⏎, and
// shows each as a boxed "?". These three are in both, and in Windows Terminal's Cascadia Mono; Claude Code
// itself marks a pass with √ on Windows.
export const WINDOWS_GLYPHS: Glyphs = { right: '√', wrong: '×', enter: 'enter:' }

/** What biteq does differently per client. Add a field here rather than a client check at a call site. */
export type ClientTraits = {
  /** The pane is drawn in the terminal's own font, so on Windows it takes WINDOWS_GLYPHS (traitsOf). */
  terminalFont: boolean
  /** The marks it draws; UNICODE_GLYPHS unless traitsOf swapped them. */
  glyphs: Glyphs
  /** Buttons answer to letter hotkeys (a–d, n, z, q) and show them; ctrl+x tab gives the pane the keyboard. */
  hotkeys: boolean
  /** Next/Skip and Banks are a hint bar on the pane's bottom row, pressed by hotkey and kept out of the focus ring. */
  hintBar: boolean
  /** Enter on the answered option moves on (the hint bar's "⏎ next"), so the ring stays on that option after answering. */
  enterMovesOn: boolean
  /** The pane dims while it doesn't have the keyboard. */
  dimsWhenUnfocused: boolean
  /** Action buttons (Next, Skip, ...) draw bracketed in the BiteQ colour, "[ Skip ]": a bare Button draws as plain text. */
  bracketActions: boolean
  /** The pane draws its own "BiteQ - ..." title row. */
  showsTitle: boolean
  /** How an answer option's letter reads: "a: ..." or "a) ...". */
  optionSeparator: ':' | ')'
  /** The quiz aligns to the start (left) instead of stretching across the pane. */
  alignStart: boolean
  /** The first answer (and Next / Serve next question) takes the focus ring when drawn. */
  autoFocus: boolean
  /** The quiz is drawn by the surface module quiz-client.tsx. */
  clientModule: boolean
  /**
   * A new wait asks for the pane's keyboard (the composer is empty then): on the desktop the first click is a
   * press; in the CLI a-d answer at once, without ctrl+x tab (hard to find, and a click in a Windows console
   * selects text instead). The engine refuses it over a half-typed prompt or a dialog; Esc hands the keys back.
   */
  focusOnWait: boolean
  /** The pane offers its own close: a Close button, or the CLI hint bar's q: close. The desktop pane's X does that. */
  closeButton: boolean
  /** A wrapped Button label comes out centered, so a long answer is drawn as one Button per word. */
  wordButtons: boolean
  /**
   * Drawn inline (the terminal's classic layout), the pane shows only how to switch Claude Code to fullscreen, where
   * it docks beside the chat and takes clicks. The person's f is the yes; Claude Code's own /tui makes the change.
   */
  offersFullscreen: boolean
}

export const TRAITS: Record<Client, ClientTraits> = {
  [Client.ClaudeCli]: {
    terminalFont: true, glyphs: UNICODE_GLYPHS,
    hotkeys: true, hintBar: true, enterMovesOn: true, dimsWhenUnfocused: true, bracketActions: false,
    showsTitle: true, optionSeparator: ')', alignStart: false, autoFocus: false, clientModule: false, focusOnWait: true,
    closeButton: true, wordButtons: false, offersFullscreen: true,
  },
  [Client.ClaudeDesktop]: {
    terminalFont: false, glyphs: UNICODE_GLYPHS,
    hotkeys: false, hintBar: false, enterMovesOn: false, dimsWhenUnfocused: false, bracketActions: true,
    showsTitle: false, optionSeparator: ':', alignStart: true, autoFocus: true, clientModule: true, focusOnWait: true,
    closeButton: false, wordButtons: true, offersFullscreen: false,
  },
}

/**
 * Anything else: a surface biteq doesn't support yet (the VS Code extension, mobile) or none at all
 * (a headless `claude -p`). A plain pane drawn by the hook: clickable bracketed buttons, no hotkeys.
 */
export const FALLBACK: ClientTraits = {
  terminalFont: false, glyphs: UNICODE_GLYPHS,
  hotkeys: false, hintBar: false, enterMovesOn: false, dimsWhenUnfocused: false, bracketActions: true,
  showsTitle: true, optionSeparator: ')', alignStart: false, autoFocus: false, clientModule: false, focusOnWait: false,
  closeButton: true, wordButtons: false, offersFullscreen: false,
}

const BY_SURFACE: Record<string, Client> = Object.fromEntries(Object.values(Client).map(c => [c, c]))

/** The engine's surface name ('terminal', 'desktop', ...) as a Client; null for one biteq doesn't support, or none. */
export function toClient(surface: string | null | undefined): Client | null {
  return (surface && BY_SURFACE[surface]) || null
}

/**
 * The traits of a client; FALLBACK for an unsupported client or none. `windows`: Claude Code runs on
 * Windows (register.ts reads it once per session), where a client drawn in the terminal's font gets WINDOWS_GLYPHS.
 */
export function traitsOf(client: Client | null, windows = false): ClientTraits {
  const traits = client === null ? FALLBACK : TRAITS[client]
  return windows && traits.terminalFont ? { ...traits, glyphs: WINDOWS_GLYPHS } : traits
}
