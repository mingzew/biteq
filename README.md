# biteq

Bite-size coding questions that appear while your AI agent is thinking, so you practice instead of reaching for your phone.

```
BiteQ - Bite Size Coding Questions
● Claude is thinking  0:42                              streak 3 · 12/15
[ruby] Hash.new with a default array
What does `p h` print?

  h = Hash.new([])
  h[:a] << 1
  p h

a) {:a=>[1]}
b) {}
...
```

**Status: V0 alpha. Claude Code only (Anthropic models). Tested on macOS.**

## How it works

biteq is a Claude Code plugin of **function hooks** (`plugins/biteq-ts`): it runs inside Claude Code's own
engine, and Claude Code draws the quiz pane itself, beside the conversation, in the terminal, the desktop
app's Code tab, and the VS Code / Cursor extension.

- Nothing to install beyond Claude Code: no Python, Node or binary.
- The pane opens with the session; each prompt serves a question while Claude works, and the banner and a
  toast tell you when Claude is done or needs your input.
- Questions come one language at a time (default Ruby, then the other banks A-Z). Missed questions come back
  later (light spaced repetition).
- Stats are shared by every Claude Code session. `/biteq stats` tracks the key metric: in what share of AI
  waits you practiced.

See [`plugins/biteq-ts/README.md`](plugins/biteq-ts/README.md) for the layout and development, and
[`docs/flow.md`](docs/flow.md) for a step-by-step trace through the code.

## Requirements

Claude Code with function-hooks plugins (an early-access API): the terminal CLI, the Claude desktop app's
Code tab, or the Claude Code extension in VS Code or Cursor.

## Quick start

1. Load the plugin, using **either** option:
   - **Plugin** (installed once, shared by the CLI, the desktop app and the extensions):
     `/plugin marketplace add <you>/biteq`, then `/plugin install biteq-ts@biteq`.
     From a local checkout: `/plugin marketplace add /path/to/biteq`.
   - **Local dev:** `claude --plugin-dir ./plugins/biteq-ts` (applies to that one session only).
2. The pane opens with the session (in a terminal narrower than 144 columns, type `/biteq`).
3. Prompt Claude. A question appears. In the desktop app, click an answer, then **Next**. In the terminal,
   `ctrl+x tab` gives the pane the keyboard: `a`–`d` answer, `n` next, `s` skip, `q` close.

Cursor's own chat agent is a different harness and doesn't run Claude Code plugins.

## Commands

| Command | What it does |
|---|---|
| `/biteq [--lang a,b]` | Open the pane; `--lang` picks the languages served first and is remembered (default `ruby`) |
| `/biteq langs` | List question banks in serving order and the selected languages |
| `/biteq check` | Validate the question banks |
| `/biteq stats` | Your stats |
| `/biteq doctor` | Claude Code version, plugin path, store, status, debug log, questions |
| `/biteq reset [--all]` | Reset the session status; `--all` also clears stats, config and the debug log |

Debugging: `BITEQ_DEBUG=1` (set in the environment Claude Code runs in) records each event to
`~/.biteq/events-ts.log`. `BITEQ_HOME` changes that directory.

## Adding questions or a language

Questions live in `plugins/biteq-ts/data/questions/<lang>.json`, one JSON array per language.
To add a language, create `<lang>.json` (`[]` is valid). The language is the filename. Each question has this shape:

```json
{
  "id": "ruby-hash-default-shared",
  "title": "Hash.new with a default array",
  "prompt": "What does `p h` print?",
  "code": "h = Hash.new([])\nh[:a] << 1\np h",
  "options": ["{:a=>[1]}", "{}", "{:a=>[]}", "KeyError"],
  "answer": 1,
  "explanation": "Why the answer is right."
}
```

`id` must start with `<lang>-` and be unique across all banks; `options` has 2–4 entries; `answer` is the index of the right one.
Run `/biteq check` after editing.

## Not built yet

Notifications outside Claude Code, focusing the agent app when it's done (`macos.ts` stubs), Cursor
native-agent support.
