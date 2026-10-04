# biteq

Bite-size coding questions that appear while your AI agent is thinking, so you practice instead of reaching for your phone.

```
 ● AI is thinking  0:42                                   streak 3 · 12/15
 [python] Closures in a loop
 What does this print?

   fs = [lambda: i for i in range(3)]
   print([f() for f in fs])

   a) [0, 1, 2]
   b) [2, 2, 2]
   ...
```

**Status: V0 alpha. macOS only. Claude (Anthropic) models via Claude Code only.**

## How it works

```
Claude Code hooks ──► biteq hook ──► ~/.biteq/sessions.json ──► biteq pane (TUI)
(UserPromptSubmit, PostToolUse,      (one entry per session)   shows a question while thinking,
 Notification, Stop, SessionEnd)                               flashes when the AI is done
```

- Python stdlib only, so there is nothing to `pip install`.
- The hook never prints anything and always exits 0, so it can't pollute Claude's context or block it.
- Multiple agent sessions are supported: the pane shows "thinking" while any of them is working.
- Missed questions come back later (light spaced repetition).
- `biteq stats` tracks the key metric: in what share of AI waits you practiced.

## Requirements

- macOS with `python3` 3.8 or newer. macOS doesn't ship Python itself; `/usr/bin/python3` only works once the
  Command Line Tools are installed (`xcode-select --install`). The system Python 3.9 is fine.
- Claude Code (terminal CLI, the Claude desktop app's Code tab, or the Claude Code extension inside Cursor).

## Quick start

1. Open the pane in its own terminal window or split next to your agent:
   ```bash
   python3 plugins/biteq/bin/biteq pane --lang python      # or: --lang python,ruby
   ```
   The language choice is remembered; later a bare `biteq pane` reuses it (default: `python`).
2. Connect Claude Code, using **either** option:
   - **Plugin** (installed once, shared by the CLI, the desktop app and the Cursor extension):
     `/plugin marketplace add <you>/biteq`, then `/plugin install biteq@biteq`.
     From a local checkout: `/plugin marketplace add /path/to/biteq`.
   - **Local dev:** `claude --plugin-dir ./plugins/biteq` (applies to that one terminal process only).
3. Prompt Claude. A question appears. Answer with `a`–`d`, press `n` for the next one, `s` to skip, `q` to quit.

Cursor's own chat agent is a different harness and does not run Claude Code hooks (see `lib/biteq/cursor.py`, not implemented yet).

## Commands

| Command | What it does |
|---|---|
| `biteq pane [--lang a,b]` | Open the quiz pane; `--lang` is remembered |
| `biteq langs` | List question banks and the selected languages |
| `biteq check` | Validate the question banks |
| `biteq stats` | Your stats |
| `biteq doctor` | Check python, state dir, plugin install, last hook event |
| `biteq reset [--all]` | Clear live sessions; `--all` also clears stats, config and the debug log |
| `biteq hook [--source claude]` | Hook entrypoint (used by `hooks/hooks.json`) |

Debugging: `BITEQ_DEBUG=1` (set in the environment Claude runs in) records every raw hook payload to `~/.biteq/events.log`.
`BITEQ_HOME` changes the state directory (default `~/.biteq`).

## Layout

```
plugins/biteq/
├── bin/biteq             thin entrypoint (hook path always exits 0)
├── hooks/hooks.json      Claude Code hook registration (Claude Code only; Cursor has its own hooks file)
├── lib/biteq/
│   ├── cli.py            commands
│   ├── store.py          ~/.biteq paths, JSON helpers, session status (sessions.json) with locking
│   ├── claude.py         Claude Code hook payload -> status
│   ├── cursor.py         STUB: Cursor native-agent adapter
│   ├── pane.py           curses UI
│   ├── quiz.py           question banks, stats
│   ├── config.py         remembered languages
│   ├── debug.py          BITEQ_DEBUG event log
│   └── macos.py          STUBS: open pane window, notifications, focus app
└── data/questions/       one JSON file per language
```

## Adding questions or a language

Questions live in `plugins/biteq/data/questions/<lang>.json`, one JSON array per language.
To add a language, create `<lang>.json` (`[]` is valid; `ruby.json` is an empty bank waiting for questions).
The language is the filename. Each question has this shape:

```json
{
  "id": "python-mutable-default",
  "title": "Mutable default argument",
  "prompt": "What does this print?",
  "code": "def add(x, items=[]): ...",
  "options": ["[2]", "[1, 2]", "TypeError", "None"],
  "answer": 1,
  "explanation": "Why the answer is right."
}
```

`id` must start with `<lang>-` and be unique across all banks; `options` has 2–4 entries; `answer` is the index of the right one.
Run `biteq check` after editing.

## Not built yet

Opening the pane window automatically, notifications, focusing the agent app when it's done, Cursor native-agent
support, Ruby questions.
