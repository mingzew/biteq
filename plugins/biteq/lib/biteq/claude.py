"""Claude Code hook adapter: hook payload -> (session_id, status, cwd).

Registered in hooks/hooks.json. Claude Code (CLI, Desktop app, and the extension
inside Cursor) all send this payload shape.
"""

# Hook event -> session status (None removes the session)
EVENT_STATUS = {
    "UserPromptSubmit": "thinking",
    "PostToolUse": "thinking",   # resumes "thinking" after a permission prompt
    "PostToolUseFailure": "thinking",
    "Stop": "done",
    "SessionEnd": None,
}
# PreToolUse only matters for tools that block until the user responds
WAIT_TOOLS = ("AskUserQuestion", "ExitPlanMode")
# Notification events: notification_type -> session status (other types are ignored)
NOTIFICATION_STATUS = {
    "permission_prompt": "waiting",
    "idle_prompt": "done",       # also clears an interrupted session; Stop doesn't fire on interrupt
}


def parse(data):
    """Returns None to ignore the event, else (session_id, status, cwd).

    status None means "remove this session".
    """
    event = data.get("hook_event_name", "")
    session = data.get("session_id") or "default"
    cwd = data.get("cwd", "")
    if event == "Notification":
        status = NOTIFICATION_STATUS.get(data.get("notification_type"))
        return (session, status, cwd) if status else None
    if event == "PreToolUse":
        return (session, "waiting", cwd) if data.get("tool_name") in WAIT_TOOLS else None
    if event in EVENT_STATUS:
        return (session, EVENT_STATUS[event], cwd)
    return None
