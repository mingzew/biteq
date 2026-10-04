"""Optional raw hook-payload log. Enable with BITEQ_DEBUG=1; writes ~/.biteq/events.log."""
import os
import time

from .store import EVENTS_LOG, HOME

MAX_BYTES = 1024 * 1024


def enabled():
    return os.environ.get("BITEQ_DEBUG", "").lower() not in ("", "0", "false", "no")


def log_event(source, raw):
    """Append one line: ISO time, source, raw payload. Never raises."""
    try:
        HOME.mkdir(parents=True, exist_ok=True)
        if EVENTS_LOG.exists() and EVENTS_LOG.stat().st_size > MAX_BYTES:
            os.replace(EVENTS_LOG, EVENTS_LOG.with_name("events.log.1"))
        line = "%s\t%s\t%s\n" % (time.strftime("%Y-%m-%dT%H:%M:%S"), source,
                                 " ".join(raw.split()))
        with open(EVENTS_LOG, "a") as f:
            f.write(line)
    except Exception:
        pass
