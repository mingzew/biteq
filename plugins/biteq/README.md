# biteq

biteq as a Claude Code **function-hooks** plugin. It runs inside Claude Code's own engine, so users
install nothing (no Python, Node or binary), and Claude Code draws the quiz pane itself: in the
terminal, in the desktop app's Code tab, and in the VS Code / Cursor extension.

Claude Code labels this plugin API early access ("may change between releases").

## Try it

```bash
claude --plugin-dir ./plugins/biteq
```

The pane opens with the session and again on each prompt (unless you close it). In the desktop app,
click an answer, then **Next**. In the terminal it docks beside the conversation at 144+ columns,
otherwise inline; `ctrl+x tab` gives it the keyboard: the arrow keys walk the answers, `a`–`d` (or Enter)
answer, and a hint bar on the pane's bottom row names the rest: `n: skip · z: banks · q: close` before
answering, `⏎ next · z: banks · q: close` after (Enter on the answered question moves on; `n` still does,
unshown). Esc goes back to the prompt. Resting after Claude is done, the bar reads `n: serve next · s: always
serve · z: banks · q: close`. Missed questions come back (30% of the time, and only those once nothing is
unseen). Once every selected question is answered, and every missed one answered right since, the pane says
"Congratulations! 38 of 47 in one shot." (the total only with several banks), lists each bank with how many of
its questions you got right the first time you ever saw them (`✓ ruby  one-shot 35/44`, a perfect bank in
the BiteQ colour) and says how to go on: "Press n to start over, or z to choose other banks." in the terminal,
"Click Start over to go again, or Banks to choose other banks." in the desktop app; the bar reads
`n: start over · z: banks · q: close`.

`z` (desktop: **Banks**) opens the bank screen at any time: one toggle per bank with its question count,
`1`–`9` in the terminal (or the arrow keys and Enter). Each change is saved at once, and the last checked
bank can't be unchecked. `z` (or **Done**) goes back: an unanswered question from a bank you unchecked is
replaced; an answered one stays so you can read its explanation.
Space and `;` can't be bound: Claude Code allows only a letter or digit as a hotkey. (The desktop app keeps its keys in the message box, so the pane shows no key
hints there.)

| Command | What it does |
|---|---|
| `/biteq [--lang a,b]` | Open the pane; `--lang` is validated and remembered (default `cs`). Only those banks are served, mixed: a random bank with unseen questions, then a random question in it. Once all are answered the pane offers Start over. Switching banks replaces an unanswered question from a bank no longer selected |
| `/biteq langs` | List question banks and the selected languages |
| `/biteq check` | Validate the question banks |
| `/biteq stats` | Your stats; per bank, `correct` (every attempt) and `one-shot` (right the first time, of the bank) |
| `/biteq doctor` | Claude Code version, plugin path, store, status, debug log, questions |
| `/biteq pause on\|off` | Whether a new question is served once Claude is done: `on` (default) rests until Claude works again, `off` keeps serving. Remembered |
| `/biteq debug [on\|off]` | Turn the event log on or off. Remembered. Does not change which sessions send telemetry |
| `/biteq reset [--all]` | Reset the session status; `--all` also clears stats, config and the debug log |
| `/biteq start` / `stop` | Manually mark Claude as thinking / done (debugging) |

In the desktop app `/biteq` also works when the app doesn't list it: the plugin catches the typed
text and never sends it to Claude.

Debugging: `/biteq debug` records each event to `~/.biteq/events.log` (`BITEQ_HOME` moves it). `/biteq debug off` stops it.

## Layout

```
plugins/biteq/
├── hooks/hooks.json         names the hooks module
├── hooks/register.ts        entry: registers every event; the ONLY file that touches `$`
├── hooks/biteq/
│   ├── cli.ts               /biteq subcommands; signal(): every status goes through it
│   ├── store.ts             store keys, JSON helpers, this session's status
│   ├── claude.ts            engine event -> status: parse()
│   ├── pane.tsx             questions, answering, onStatus, press(), render()
│   ├── quiz.ts              question banks, stats, validate
│   ├── config.ts            remembered languages
│   ├── debug.ts             event log, on after /biteq debug
│   ├── macos.ts             STUBS: notify, focusApp
│   └── io.ts                the operations modules get from the engine (see below)
├── types/index.d.ts         the session state's contract (what the pane draws from)
├── data/questions/          one JSON file per language
└── tests/biteq.test.tsx     claude plugin test
```

**Why `io.ts`.** The engine only lets its handle `$` be used in the file whose hook received it; it
can't be passed across an import, and every store/state/env access must be named literally so
`claude plugin validate` can list them. So `register.ts` registers every event, builds an `io`
object of small closures over `$`, and the modules take `io` instead of calling the engine
themselves. A module that needs a new engine capability adds it to `Io` and to `io()` in
`register.ts`.

## How it works

**Design rule: the quiz is a pane.** Keep it in the Claude Code pane opened with `$.ui.open` (docked beside
the conversation; inline above the prompt only when there's no room to dock). Don't move it to the
`AbovePrompt` band, the status line, toasts or a separate window unless the team explicitly decides otherwise.

Each Claude Code session runs its own copy of the plugin and draws its own pane, so there's no state
file, lock or polling. Engine events set the session's status:

| Event | Status |
|---|---|
| `turn.start` | thinking: count the wait, serve a question, open the pane |
| `turn.complete` | done (also on interrupt; a subagent's turn is ignored). The question on screen can still be answered, but Next rests ("Claude is done, go review") instead of serving, until the next `turn.start`; unless `/biteq pause off` or **Always serve** (`config.pauseWhenDone`) |
| `tool.call` for AskUserQuestion / ExitPlanMode | waiting while the tool blocks, thinking once it returns |
| `classic.Notification` | waiting on `permission_prompt`, done on `idle_prompt` |

Stats and the remembered languages live in Claude Code's plugin store (`~/.claude/plugins/store/`),
shared by every session. Cursor's own agent isn't supported: it only runs command hooks, not
in-engine modules (the Claude Code extension inside Cursor works).

## Develop

**If the pane shows inline above the prompt instead of docked:** the terminal pane only docks in Claude Code's
fullscreen layout. Claude Code turns fullscreen off by itself after sessions end abruptly (it records
`"fullscreenAutoDisabled"` in `~/.claude.json`), for example when a test harness kills `claude` instead of
exiting with `/exit`. Remove that key, or re-enable fullscreen, and restart the session.

```bash
claude plugin validate plugins/biteq   # what the engine sees, and what it would refuse
claude plugin test plugins/biteq       # tests/*.test.tsx against the engine (terminal/desktop/vscode)
```

`tsconfig.json` extends `.claude-plugin/types/tsconfig.json`, which Claude Code writes (gitignored)
when it loads the plugin. Until it exists, `from 'claude-code'` shows as unresolved in the editor.
To generate it, start a session with the plugin loaded (there is no separate command):

```bash
claude --plugin-dir ./plugins/biteq
```

Then `npx -p typescript@5 tsc -p plugins/biteq/tsconfig.json` type-checks everything.
