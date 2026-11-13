# BiteQ

Bite-size coding questions that appear while your AI agent is thinking, so you practice instead of reaching for your phone.

![BiteQ pane beside Claude Code, showing a question while Claude works](docs/images/demo.png)

## Install

BiteQ is a plugin for [Claude Code](https://code.claude.com) (it uses function-hooks plugins, an early-access feature). You don't need to install anything else.

**In a Claude Code session (terminal or desktop app)**

```
/plugin marketplace add mingzew/biteq
/plugin install biteq@biteq
/reload-plugins
```

**Or from your terminal, as one line**

```bash
claude plugin marketplace add mingzew/biteq && claude plugin install biteq@biteq
```

Then start a new session. Check it worked with `claude plugin list` (it shows `biteq@biteq` enabled). Remove it with `claude plugin uninstall biteq@biteq`.

## First run

1. The pane opens with your session. In a terminal narrower than 144 columns, type `/biteq` to open it.
2. Prompt Claude. A question appears while Claude works.
3. Answer it, then move on.

| Where | How to answer | Other keys |
| --- | --- | --- |
| Terminal | Arrow keys and Enter, or `a`–`d` | `n` skip · `z` switch banks · `q` close · Enter for next after answering |
| Desktop app | Click an answer, then **Next** | **Switch Q banks** to change bank; the pane's own X closes it |

In the terminal the pane takes the keyboard each time Claude starts working (never over a half-typed prompt). Press Esc to hand it back to the prompt, or `ctrl+x tab` to give it to the pane again. On Windows the terminal shows `√`/`×` and `enter: next`, because console fonts have no `✓ ✗ ⏎`.

## Commands

| Command                | What it does                                                                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/biteq [--lang bank]` | Open the pane; `--lang` picks the one bank to serve and is remembered (default `cs`). In the pane, `z` does the same                                                                      |
| `/biteq langs`         | List question banks, the selected ones first                                                                                                                                              |
| `/biteq check`         | Validate the question banks                                                                                                                                                               |
| `/biteq stats`         | Your stats: AI waits practised in while Claude worked and at any time, answers, streak, to review; per bank, `correct` (every attempt) and `one-shot` (right the first time, of the bank) |
| `/biteq doctor`        | Claude Code version, plugin path, store, status, debug log, questions                                                                                                                     |
| `/biteq pause on\|off` | Whether a new question is served once Claude is done: `on` (default) rests until Claude works again, `off` keeps serving. Remembered                                                      |
| `/biteq debug [on\|off]` | Record each event to `~/.biteq/events.log` (`BITEQ_HOME` changes that directory). Remembered                                                                                            |
| `/biteq reset [--all]` | Reset the session status; `--all` also clears stats, config and the debug log                                                                                                             |

## How it works for you

- **Questions arrive while Claude works.** When Claude is done, you can finish the question on screen, but Next won't serve another: the pane says "Claude is done, go review" until Claude works again. **Serve next question** serves one anyway, and **Always serve** turns the pause off for good (`/biteq pause on` turns it back on). A new session opens the pane resting too, until you prompt Claude.
- **One bank at a time.** The default is `cs` (general CS questions, so anyone can start right away). Press `z` at any time to pick another bank; it's saved at once.
- **Missed questions come back.** Light spaced repetition, and once nothing is unseen they keep coming back until you get them right. When you finish a bank the pane congratulates you, shows how many you got right in one shot, and offers **Start over** or another bank.
- **Stats are shared by every session.** `/biteq stats` tracks the key number: how many AI waits (from one prompt to the next) you practised in while Claude worked.

## Status

Alpha, version 0.1.0.

- Supported: the Claude CLI and the Claude desktop app's Code tab, on macOS and Windows.
- Other clients (for example the VS Code or Cursor extensions) get a basic fallback, not the full pane experience. Cursor's own chat agent doesn't run Claude Code plugins at all.
- Not built yet: notifications outside Claude Code, focusing the agent app when it's done, and Cursor native-agent support.

## Contributing

Want to add questions, a language, or change the code? See [CONTRIBUTING.md](CONTRIBUTING.md).
