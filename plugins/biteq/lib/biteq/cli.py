"""biteq command line: pane, hook, langs, check, stats, doctor, reset, start, stop."""
import argparse
import json
import locale
import os
import sys
import time
from pathlib import Path

from . import config, debug, quiz, store

SOURCES = ("claude", "cursor")


# ---------------------------------------------------------------- hook

def hook_main(argv):
    """Hook entrypoint. Must stay silent and exit 0 (the caller in bin/biteq enforces it):
    UserPromptSubmit stdout is added to Claude's context, and exit code 2 blocks the agent.
    """
    source = "claude"
    if "--source" in argv:
        i = argv.index("--source")
        source = argv[i + 1] if i + 1 < len(argv) else source
    raw = sys.stdin.read()
    if debug.enabled():
        debug.log_event(source, raw)
    data = json.loads(raw)
    if source == "cursor":
        from . import cursor as adapter
    else:
        from . import claude as adapter
    parsed = adapter.parse(data)
    if parsed:
        session, status, cwd = parsed
        store.set_status(session, status, cwd)


# ---------------------------------------------------------------- commands

def cmd_pane(args):
    available = quiz.language_counts()
    if args.lang:
        langs = [l.strip() for l in args.lang.split(",") if l.strip()]
        unknown = [l for l in langs if l not in available]
        if unknown:
            sys.exit("biteq: unknown language %s (available: %s)"
                     % (", ".join(unknown), ", ".join(sorted(available))))
    else:
        langs = config.get_langs()
    questions = quiz.load_questions(langs)
    if not questions:
        sys.exit("biteq: no questions for %s. Counts: %s. Run `biteq langs`."
                 % (",".join(langs), ", ".join("%s %d" % kv for kv in sorted(available.items()))))
    if args.lang:
        config.set_langs(langs)   # remembered for the next bare `biteq pane`

    import curses
    from .pane import Pane
    locale.setlocale(locale.LC_ALL, "")
    os.environ.setdefault("ESCDELAY", "25")
    curses.wrapper(Pane(questions).run)


def cmd_langs(_):
    chosen = config.get_langs()
    for lang, n in sorted(quiz.language_counts().items()):
        print("%-8s %3d questions%s" % (lang, n, "   <- selected" if lang in chosen else ""))


def cmd_check(_):
    summary, errors = quiz.validate()
    print(summary)
    for e in errors:
        print("ERROR", e)
    sys.exit(1 if errors else 0)


def cmd_stats(_):
    s = quiz.load_stats()
    pct = lambda a, b: "%d%%" % (100 * a / b) if b else "n/a"
    print("answered      %d  (%s correct)" % (s["answered"], pct(s["correct"], s["answered"])))
    print("streak        %d  (best %d)" % (s["streak"], s["best_streak"]))
    print("AI waits      %d  (you practiced during %s of them)"
          % (s["waits"], pct(s["engaged_waits"], s["waits"])))
    for lang, (c, n) in sorted(s["by_lang"].items()):
        print("  %-10s %d/%d" % (lang, c, n))
    print("to review     %d questions you missed" % len(s["wrong"]))


def _plugin_installed():
    """Best effort: does 'biteq' appear in Claude Code's plugin/settings files?
    A --plugin-dir dev session will not show up here."""
    claude = Path.home() / ".claude"
    files = [claude / "settings.json"] + sorted((claude / "plugins").glob("*.json"))
    for f in files:
        try:
            if "biteq" in f.read_text():
                return "yes (%s)" % f.name
        except Exception:
            pass
    return "not found (fine if you use --plugin-dir)"


def _writable(path):
    try:
        path.mkdir(parents=True, exist_ok=True)
        probe = path / ".probe"
        probe.write_text("")
        probe.unlink()
        return True
    except Exception:
        return False


def _ago(ts):
    secs = int(time.time() - ts)
    if secs < 60:
        return "%ds ago" % secs
    if secs < 3600:
        return "%dm ago" % (secs // 60)
    return "%dh ago" % (secs // 3600)


def cmd_doctor(_):
    v = sys.version_info
    print("python        %s (%d.%d.%d)%s" % (sys.executable, v[0], v[1], v[2],
                                           "" if v >= (3, 8) else "  <- need 3.8+"))
    print("state dir     %s (%s)" % (store.HOME, "writable" if _writable(store.HOME) else "NOT writable"))
    print("plugin        %s" % _plugin_installed())
    sessions = store.load_json(store.SESSIONS, {}).get("sessions", {})
    if sessions:
        last = max(s.get("updated", 0) for s in sessions.values())
        print("last event    %s (%d session%s tracked)"
              % (_ago(last), len(sessions), "" if len(sessions) == 1 else "s"))
    else:
        print("last event    none yet (prompt Claude with the plugin enabled)")
    print("debug log     %s" % (store.EVENTS_LOG if store.EVENTS_LOG.exists()
                                else "off (set BITEQ_DEBUG=1 to record raw hook payloads)"))
    counts = quiz.language_counts()
    print("questions     %d (%s)" % (sum(counts.values()),
                                     ", ".join("%s %d" % kv for kv in sorted(counts.items()))))
    print("selected      %s" % ",".join(config.get_langs()))


def cmd_reset(args):
    targets = [store.SESSIONS]
    if args.all:
        targets += [store.STATS, store.CONFIG, store.EVENTS_LOG,
                    store.EVENTS_LOG.with_name("events.log.1")]
    removed = []
    for path in targets:
        if path.exists():
            path.unlink()
            removed.append(path.name)
    print("removed: %s" % (", ".join(removed) or "nothing"))
    print("quit and restart any open `biteq pane` so it doesn't rewrite stats from memory")


def cmd_signal(args):
    store.set_status(args.session, "thinking" if args.cmd == "start" else "done")


# ---------------------------------------------------------------- main

def main():
    p = argparse.ArgumentParser(prog="biteq", description="Bite-size coding questions while your AI thinks.")
    sub = p.add_subparsers(dest="cmd")
    pane = sub.add_parser("pane", help="open the quiz pane")
    pane.add_argument("--lang", help="comma-separated languages, e.g. python,ruby (remembered)")
    hook = sub.add_parser("hook", help="hook entrypoint (reads JSON on stdin)")
    hook.add_argument("--source", choices=SOURCES, default="claude")
    sub.add_parser("langs", help="list question banks and the selected languages")
    sub.add_parser("check", help="validate the question banks")
    sub.add_parser("stats", help="show your stats")
    sub.add_parser("doctor", help="check the setup")
    reset = sub.add_parser("reset", help="clear live sessions")
    reset.add_argument("--all", action="store_true", help="also clear stats, config and debug log")
    for name in ("start", "stop"):
        sp = sub.add_parser(name, help="manually mark the AI as %s" % ("thinking" if name == "start" else "done"))
        sp.add_argument("--session", default="manual")
    args = p.parse_args()

    if args.cmd == "hook":      # normally handled by bin/biteq's fast path
        hook_main(sys.argv[2:])
        return
    handler = {"langs": cmd_langs, "check": cmd_check, "stats": cmd_stats, "doctor": cmd_doctor,
               "reset": cmd_reset, "start": cmd_signal, "stop": cmd_signal}.get(args.cmd)
    if handler:
        handler(args)
    else:
        cmd_pane(argparse.Namespace(lang=getattr(args, "lang", None)))
