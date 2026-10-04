"""Cursor native-agent hook adapter. STUB: not implemented yet.

Cursor's own agent does not read the Claude plugin's hooks.json. Cursor hooks are
registered in ~/.cursor/hooks.json (or <project>/.cursor/hooks.json) and would call:

    python3 /abs/path/to/biteq hook --source cursor

Claude Code running inside Cursor does NOT need this; it uses claude.py.

TODO when implemented:
  - map Cursor events (beforeSubmitPrompt, stop, ...) to thinking/done like claude.parse()
  - use conversation_id as the session id
  - some Cursor hooks expect a JSON reply on stdout; the hook path currently prints nothing
  - verify real payloads first with BITEQ_DEBUG=1 (~/.biteq/events.log)
"""


def parse(data):
    """Same contract as claude.parse(): None to ignore, else (session_id, status, cwd)."""
    raise NotImplementedError("Cursor adapter is not implemented yet")
