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

## How it works

```
Claude Code hooks ──► biteq hook ──► ~/.biteq/state.json ──► biteq pane (TUI)
(UserPromptSubmit, PostToolUse,      (one entry per session)   shows a question while thinking,
 Notification, Stop, SessionEnd)                               flashes when the AI is done
```

- Python stdlib only, so there's nothing to install.
- The hook never prints anything and always exits 0, so it can't pollute Claude's context or block it.
- Multiple agent sessions are supported: the pane shows "thinking" while any of them is working.
- Missed questions come back later (light spaced repetition).
- `biteq stats` tracks the key metric: in what share of AI waits you practiced.

## Quick start

1. Open the pane in a split next to your agent (tmux, iTerm, or a VS Code terminal):
   ```bash
   python3 plugins/biteq/bin/biteq pane            # or: --lang python,js,sql
   ```
2. Connect Claude Code, using **either** option:
   - **Plugin** (from a pushed GitHub repo):
     `/plugin marketplace add <you>/biteq`, then `/plugin install biteq@biteq`
   - **Local dev:** `claude --plugin-dir ./plugins/biteq`
3. Prompt Claude. A question appears. Answer with `a`–`d`, press `n` for the next one, `s` to skip, `q` to quit.

Other agents (Cursor hooks, Codex `notify`, wrappers) can call `biteq start` and `biteq stop`.

## Adding questions

Edit `plugins/biteq/data/questions.json`, then run `biteq check`. Each question has this shape:
`{id, lang, title, prompt, code, options[2-4], answer (index), explanation}`.
