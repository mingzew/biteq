# biteq

Bite-size coding questions that appear while your AI agent is thinking, so you practice instead of reaching for your phone.

```
BiteQ - Bite Size Coding Questions
streak 3 · best 12
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

biteq is a Claude Code plugin of **function hooks** (`plugins/biteq`): it runs inside Claude Code's own
engine, and Claude Code draws the quiz pane itself, beside the conversation, in the terminal, the desktop
app's Code tab, and the VS Code / Cursor extension.

- Nothing to install beyond Claude Code: no Python, Node or binary.
- The pane opens with the session; each prompt serves a question while Claude works.
- Once Claude is done you can finish the question on screen, but Next doesn't serve another: the pane says
  "Claude is done, go review" until Claude works again. **Serve next question** serves one anyway; **Always serve**
  turns this off for good (remembered; `/biteq pause on` turns it back on).
- Questions are a mix of the banks you select (default `cs`, general CS questions, so anyone can start right
  away). Only those banks are served. Missed questions come back later (light spaced repetition), and once
  nothing is unseen they come back until you get them right. Then the pane congratulates you, says how many
  you got right in one shot (the first time you ever saw them) for each bank, and offers **Start over** (`n` in
  the terminal) or other banks (`z`).
- Stats are shared by every Claude Code session. `/biteq stats` tracks the key metric: in what share of AI
  waits you practiced. For each bank it also shows your correct answers (re-asks included) and how many of
  its questions you got right in one shot; Start over keeps that, only `/biteq reset --all` clears it.

**Design rule: the quiz is a pane.** BiteQ is shown in a Claude Code pane (`$.ui.open`): docked beside
the conversation in the terminal's fullscreen layout and in the desktop app, inline above the prompt only when
there's no room to dock. Keep it a pane. Don't move it to the band above the prompt, the status line, toasts or
a separate window unless the team explicitly decides otherwise.

See [`plugins/biteq/README.md`](plugins/biteq/README.md) for the layout and development, and
[`docs/flow.md`](docs/flow.md) for a step-by-step trace through the code.

## Requirements

Claude Code with function-hooks plugins (an early-access API): the terminal CLI, the Claude desktop app's
Code tab, or the Claude Code extension in VS Code or Cursor.

## Quick start

1. Load the plugin, using **either** option:
   - **Plugin** (installed once, shared by the CLI, the desktop app and the extensions):
     `/plugin marketplace add <you>/biteq`, then `/plugin install biteq@biteq`.
     From a local checkout: `/plugin marketplace add /path/to/biteq`.
   - **Local dev:** `claude --plugin-dir ./plugins/biteq` (applies to that one session only).
2. The pane opens with the session (in a terminal narrower than 144 columns, type `/biteq`).
3. Prompt Claude. A question appears. In the desktop app, click an answer, then **Next**. In the terminal,
   `ctrl+x tab` gives the pane the keyboard: the arrow keys walk the answers, `a`–`d` (or Enter) answer, and the
   hint bar at the bottom names the rest: `n: skip · z: banks · q: close` before you answer, `⏎ next · z: banks ·
   q: close` after (Enter moves on; `n` still does too, though the bar no longer shows it).
4. To change what you practise, press `z` (desktop: **Banks**) at any time. Check or uncheck banks with `1`–`9`
   or the arrow keys and Enter; each change is saved at once. `z` (or **Done**) goes back to the quiz.

Cursor's own chat agent is a different harness and doesn't run Claude Code plugins.

## Commands

| Command | What it does |
|---|---|
| `/biteq [--lang a,b]` | Open the pane; `--lang` picks the banks to serve, mixed, and is remembered (default `cs`). In the pane, `z` does the same |
| `/biteq langs` | List question banks, the selected ones first |
| `/biteq check` | Validate the question banks |
| `/biteq stats` | Your stats; per bank, `correct` (every attempt) and `one-shot` (right the first time, of the bank) |
| `/biteq doctor` | Claude Code version, plugin path, store, status, debug log, questions |
| `/biteq pause on\|off` | Whether a new question is served once Claude is done: `on` (default) rests until Claude works again, `off` keeps serving. Remembered |
| `/biteq reset [--all]` | Reset the session status; `--all` also clears stats, config and the debug log |

Debugging: `/biteq debug` records each event to `~/.biteq/events.log`. `/biteq debug off` stops it. `BITEQ_HOME` changes that directory.

## Adding questions or a language

Questions live in `plugins/biteq/data/questions/<lang>.json`, one JSON array per language.
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
