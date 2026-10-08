# biteq-ts

biteq as a Claude Code **function-hooks** plugin. It runs inside Claude Code's own engine, so users
install nothing (no Python, Node or binary), and Claude Code draws the quiz pane itself: in the
terminal, in the desktop app's Code tab, and in the VS Code / Cursor extension.

Claude Code labels this plugin API early access ("may change between releases").

## Try it

```bash
claude --plugin-dir ./plugins/biteq-ts
```

The pane opens with the session and again on each prompt (unless you close it). In the desktop app,
click an answer, then **Next**. In the terminal it docks beside the conversation at 144+ columns,
otherwise inline; `ctrl+x tab` gives it the keyboard: `a`–`d` answer, `n` next, `s` skip, `q` close,
Esc back to the prompt. (The desktop app keeps its keys in the message box, so the pane shows no key
hints there.)

| Command | What it does |
|---|---|
| `/biteq [--lang a,b]` | Open the pane; `--lang` is validated and remembered (default `ruby`). Those languages are served first, one at a time: every question in a language before the next, then the other banks A-Z |
| `/biteq langs` | List question banks and the selected languages |
| `/biteq check` | Validate the question banks |
| `/biteq stats` | Your stats |
| `/biteq doctor` | Claude Code version, plugin path, store, status, debug log, questions |
| `/biteq reset [--all]` | Reset the session status; `--all` also clears stats, config and the debug log |
| `/biteq start` / `stop` | Manually mark Claude as thinking / done (debugging) |

In the desktop app `/biteq` also works when the app doesn't list it: the plugin catches the typed
text and never sends it to Claude.

Debugging: `BITEQ_DEBUG=1` in the environment Claude Code runs in records each event to
`~/.biteq/events-ts.log` (`BITEQ_HOME` moves it).

## Layout

```
plugins/biteq-ts/
├── hooks/hooks.json         names the hooks module
├── hooks/register.ts        entry: registers every event; the ONLY file that touches `$`
├── hooks/biteq/
│   ├── cli.ts               /biteq subcommands; signal(): every status goes through it
│   ├── store.ts             store keys, JSON helpers, this session's status
│   ├── claude.ts            engine event -> status: parse()
│   ├── pane.tsx             questions, answering, onStatus, press(), render()
│   ├── quiz.ts              question banks, stats, validate
│   ├── config.ts            remembered languages
│   ├── debug.ts             BITEQ_DEBUG event log
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

Each Claude Code session runs its own copy of the plugin and draws its own pane, so there's no state
file, lock or polling. Engine events set the session's status:

| Event | Status |
|---|---|
| `turn.start` | thinking: count the wait, serve a question, open the pane |
| `turn.complete` | done (also on interrupt; a subagent's turn is ignored) |
| `tool.call` for AskUserQuestion / ExitPlanMode | waiting while the tool blocks, thinking once it returns |
| `classic.Notification` | waiting on `permission_prompt`, done on `idle_prompt` |

Stats and the remembered languages live in Claude Code's plugin store (`~/.claude/plugins/store/`),
shared by every session. Cursor's own agent isn't supported: it only runs command hooks, not
in-engine modules (the Claude Code extension inside Cursor works).

## Develop

```bash
claude plugin validate plugins/biteq-ts   # what the engine sees, and what it would refuse
claude plugin test plugins/biteq-ts       # tests/*.test.tsx against the engine (terminal/desktop/vscode)
```

`tsconfig.json` extends `.claude-plugin/types/tsconfig.json`, which Claude Code writes (gitignored)
when it loads the plugin. Until it exists, `from 'claude-code'` shows as unresolved in the editor.
To generate it, start a session with the plugin loaded (there is no separate command):

```bash
claude --plugin-dir ./plugins/biteq-ts
```

Then `npx -p typescript@5 tsc -p plugins/biteq-ts/tsconfig.json` type-checks everything.
