"""macOS helpers. STUBS: not implemented yet, nothing calls these.

Everything here is expected to shell out to osascript / open.
"""


def open_pane_window(command):
    """Open a new Terminal.app / iTerm window running `command` (e.g. `biteq pane`).

    Planned: pidfile + flock in ~/.biteq so only one pane window is ever open,
    called from a SessionStart hook via an `ensure-pane` command.
    """
    raise NotImplementedError("open_pane_window is not implemented yet")


def notify(title, message):
    """Show a macOS notification (osascript `display notification`)."""
    raise NotImplementedError("notify is not implemented yet")


def focus_app(name):
    """Bring an app forward, e.g. `open -a Claude` or `open -a Cursor`, when the AI is done."""
    raise NotImplementedError("focus_app is not implemented yet")
