"""On-disk store in ~/.biteq (override with BITEQ_HOME): file paths, JSON helpers, sessions.

Only the session status is persisted by this module (state.json). The other paths
(stats, config, events log) are defined here but written by quiz/pane, config and debug.

state.json is the contract between the hooks (writers) and the pane (reader):
    {"sessions": {<session_id>: {"status", "since", "updated", "cwd"}}}
"""
import fcntl
import json
import os
import time
from pathlib import Path

HOME = Path(os.environ.get("BITEQ_HOME", str(Path.home() / ".biteq")))
STATE = HOME / "state.json"
STATS = HOME / "stats.json"
CONFIG = HOME / "config.json"
EVENTS_LOG = HOME / "events.log"

STALE_SECS = 6 * 3600


def load_json(path, default):
    try:
        return json.loads(path.read_text())
    except Exception:
        return default


def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".%d.tmp" % os.getpid())
    tmp.write_text(json.dumps(data, indent=2))
    os.replace(tmp, path)


def set_status(session, status, cwd=""):
    """Record a session's status; status=None removes the session."""
    HOME.mkdir(parents=True, exist_ok=True)
    with open(HOME / ".lock", "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        state = load_json(STATE, {})
        sessions = state.setdefault("sessions", {})
        now = time.time()
        for sid in [s for s, v in sessions.items() if now - v.get("updated", 0) > STALE_SECS]:
            del sessions[sid]
        if status is None:
            sessions.pop(session, None)
        else:
            cur = sessions.get(session, {})
            since = cur.get("since", now) if cur.get("status") == status else now
            sessions[session] = {"status": status, "since": since, "updated": now, "cwd": cwd}
        save_json(STATE, state)


def live_sessions(state):
    return {sid: v for sid, v in state.get("sessions", {}).items()
            if time.time() - v.get("updated", 0) <= STALE_SECS}


def aggregate(state):
    """Collapse all agent sessions into one (status, since) for the pane."""
    sessions = list(live_sessions(state).values())
    for status in ("waiting", "thinking", "done"):   # most urgent first
        hits = [s["since"] for s in sessions if s.get("status") == status]
        if hits:
            return status, (min(hits) if status == "thinking" else max(hits))
    return "idle", 0
