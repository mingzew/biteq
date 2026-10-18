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

/** What biteq does differently per client. Add a field here rather than a client check at a call site. */
export type ClientTraits = {
  /** Buttons answer to letter hotkeys (a–d, n, q) and show them; ctrl+x tab gives the pane the keyboard. */
  hotkeys: boolean
  /** Next/Skip and Close are a hint bar on the pane's bottom row, pressed by hotkey and kept out of the focus ring. */
  hintBar: boolean
  /** Enter on the answered option moves on (the hint bar's "⏎ next"), so the ring stays on that option after answering. */
  enterMovesOn: boolean
  /** The pane dims while it doesn't have the keyboard. */
  dimsWhenUnfocused: boolean
  /** Action buttons (Next, Close, Serve next question, ...) get a rounded frame: a bare Button draws as plain text. */
  framedActions: boolean
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
  /** A new wait asks for the pane's keyboard (the composer is empty then), so the first click is a press. */
  focusOnWait: boolean
}

export const TRAITS: Record<Client, ClientTraits> = {
  [Client.ClaudeCli]: {
    hotkeys: true, hintBar: true, enterMovesOn: true, dimsWhenUnfocused: true, framedActions: false,
    showsTitle: true, optionSeparator: ')', alignStart: false, autoFocus: false, clientModule: false, focusOnWait: false,
  },
  [Client.ClaudeDesktop]: {
    hotkeys: false, hintBar: false, enterMovesOn: false, dimsWhenUnfocused: false, framedActions: true,
    showsTitle: false, optionSeparator: ':', alignStart: true, autoFocus: true, clientModule: true, focusOnWait: true,
  },
}

/**
 * Anything else: a surface biteq doesn't support yet (the VS Code extension, mobile) or none at all
 * (a headless `claude -p`). A plain pane drawn by the hook: clickable framed buttons, no hotkeys.
 */
export const FALLBACK: ClientTraits = {
  hotkeys: false, hintBar: false, enterMovesOn: false, dimsWhenUnfocused: false, framedActions: true,
  showsTitle: true, optionSeparator: ')', alignStart: false, autoFocus: false, clientModule: false, focusOnWait: false,
}

const BY_SURFACE: Record<string, Client> = Object.fromEntries(Object.values(Client).map(c => [c, c]))

/** The engine's surface name ('terminal', 'desktop', ...) as a Client; null for one biteq doesn't support, or none. */
export function toClient(surface: string | null | undefined): Client | null {
  return (surface && BY_SURFACE[surface]) || null
}

/** The traits of a client; FALLBACK for an unsupported client or none. */
export function traitsOf(client: Client | null): ClientTraits {
  return client === null ? FALLBACK : TRAITS[client]
}
