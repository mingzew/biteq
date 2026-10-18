# CLAUDE.md

Guidance for AI agents (and humans) working in this repo.

## What biteq is

biteq shows bite-size coding questions in a pane inside Claude Code while Claude works, so people practise instead
of reaching for their phone and their skills don't atrophy. The key metric is the share of AI waits in which the
person practised (`/biteq stats`).

It is a Claude Code **function-hooks plugin** (`plugins/biteq`): a TypeScript module that runs inside Claude
Code's own engine. Users install nothing beyond Claude Code. The plugin API is early access and can change
between Claude Code releases; the engine's own declarations are the authority (see "Reference" below).

## Product rules (don't change without the team deciding)

- **The quiz is a pane** (`$.ui.open`), docked beside the conversation. Don't move it to the band above the prompt,
  the status line, toasts or a separate window.
- **Supported clients: the Claude CLI and the Claude desktop app's Code tab.** Anything else (VS Code, mobile,
  headless) gets the `FALLBACK` behaviour in `client.ts`; don't add work for it unless asked.
- **When Claude is done, don't serve a new question** (unless the person opted out with "Always serve" or
  `/biteq pause off`). They can finish the one on screen.
- **Questions are served one language at a time**, selected languages first (default Ruby), then the rest A-Z.
- **CLI keys:** answers are arrow-selectable buttons with `a`-`d`; Next/Skip/Close are a hint bar on the pane's
  bottom row (`n: skip · q: close`, `⏎ next` after answering) and are never in the focus ring.
- **Desktop:** everything is clickable; action buttons are framed so they read as buttons; no key hints.

## Layout

```
plugins/biteq/
├── hooks/register.ts        entry: registers every engine event; the ONLY file that touches `$`
├── hooks/biteq/
│   ├── client.ts            Client enum (ClaudeCli, ClaudeDesktop) + per-client traits
│   ├── io.ts                the operations modules may perform through the engine (built in register.ts)
│   ├── cli.ts               /biteq subcommands; signal(): every status change goes through it
│   ├── claude.ts            engine event -> status (parse)
│   ├── pane.tsx             questions, answering, resting when done, press(), render()
│   ├── quiz-client.tsx      drawQuiz (shared drawing) + the desktop surface module
│   ├── draw.tsx             re-exports drawQuiz for the hook side
│   ├── quiz.ts              question banks, stats, validation, serving order
│   ├── config.ts            remembered languages, pause-when-done
│   ├── store.ts             store keys, JSON helpers, session status
│   ├── debug.ts             event log, on after /biteq debug
│   └── macos.ts             stubs
├── types/index.d.ts         session-state contract ($.state keys the pane draws from)
├── data/questions/*.json    one bank per language; see formatting-rules.md there
└── tests/biteq.test.tsx     `claude plugin test`
docs/flow.md                 step-by-step trace of a run through the code
docs/lesson-plan.md          guided tour of the codebase
```

## Engine constraints (these break things if ignored)

- **`$` never crosses an import.** Only `register.ts` uses `$`; it builds an `io` object of closures and every
  module takes `io`. A module needing a new engine capability adds it to `Io` (io.ts) and to `io()` in register.ts.
- **Literal names only.** `$.env.get('NAME')`, and every `$.state` read/write names its atom directly (hence the
  switches in `io()`). `claude plugin validate` refuses anything else.
- **`quiz-client.tsx` must stay self-contained.** The desktop app loads it on its own, so it can't import
  *values* from other files (type imports are fine). Per-client behaviour reaches it as a `ClientTraits` value
  (from `pane.render`, or in the desktop module's props).
- **Never compare client strings.** Read `io.client()` / `io.traits()` (or `traitsOf(toClient(e.surface))` in a
  hook) and branch on a trait. A new per-client difference is a new field in `ClientTraits`; a new platform is
  one `Client` member plus one `TRAITS` row.
- **Hotkeys are one lowercase letter or digit.** Space, `;`, Enter etc. can't be button hotkeys. A terminal
  `Client` element gets raw keys, but only after a mouse click (`ctrl+x tab` doesn't focus it), so don't rely on it.
- **Presses are handled by key** (`ui.press` / `ui.message` → `pane.press`), not by `onPress` closures: redraws
  replace handlers and the desktop app can send a click from the previous drawing. Button keys encode action and
  question (`answer:2:<id>`, `next:<id>`), so a press only acts if that question is still on screen.
- **One state write first, stats after.** Each engine round trip costs ~25-60 ms; make the visible change in a
  single write (`current` holds question + pick together) so a click feels instant and can't double-count.
- **The desktop module timer** must start once per instance (`started` WeakSet), or it runs at double speed.

## Develop and verify

**Definition of done: a change isn't finished until all of these pass with zero errors.** Run them after every
edit, before saying the work is done, and report any failure with its output rather than glossing over it.

1. **Compiles:** `cd plugins/biteq && npx -p typescript@5 tsc -p tsconfig.json` exits 0 and prints nothing.
2. **The engine accepts it:** `claude plugin validate plugins/biteq` ends with `✔ Validation passed`.
3. **Tests pass:** `claude plugin test plugins/biteq` reports `0 fail`.
4. **No stray build output:** `git status` shows no new `.js` files next to the `.ts`/`.tsx` sources.
5. **Your editor agrees:** if an IDE flags an error that `tsc` doesn't, find out why (usually a different
   TypeScript version, or the generated `.claude-plugin/types` not existing yet) instead of ignoring either.

```bash
claude plugin validate plugins/biteq     # what the engine sees and would refuse
claude plugin test plugins/biteq         # tests/*.test.tsx against the engine (terminal, desktop, vscode surfaces)
cd plugins/biteq && npx -p typescript@5 tsc -p tsconfig.json   # strict type check
claude -p "/biteq check" --plugin-dir ./plugins/biteq < /dev/null   # real engine, headless
```

- `tsconfig.json` extends `.claude-plugin/types/tsconfig.json`, which Claude Code writes when it loads the plugin.
  If it's missing, run any `claude --plugin-dir ./plugins/biteq` session first; otherwise `tsc` **emits stray
  `.js` files next to the sources**. Delete any that appear.
- Every behaviour change gets a test. Check the test fails without the change (temporarily revert it) before
  trusting it.
- The test kit can't reproduce some things (a click from a stale drawing, real focus, layout). For pane layout and
  keys, verify in a real CLI session too.
- **Driving a real CLI session from a script:** exit with `/exit`, never kill `claude`. Killed sessions make Claude
  Code auto-disable fullscreen (`"fullscreenAutoDisabled"` in `~/.claude.json`), after which the pane can't dock.
  Press Esc and confirm the prompt has the keyboard before typing a prompt, or the letters land on pane hotkeys
  (an `s` once switched on "Always serve" in the real store).
- Desktop app sessions load the plugin when they start (from `CLAUDE_CODE_PLUGIN_DIRS`); open a new Code session
  to see a change.
- Stats and config live in Claude Code's plugin store (`~/.claude/plugins/store/biteq_*.json`), shared by every
  session. Don't leave test runs' changes in a real store.

## Question banks

- Follow `plugins/biteq/data/questions/formatting-rules.md`.
- **Verify every answer by running the code** (e.g. `ruby -e`) and make the correct option exactly what it
  prints. Prefer behaviour that is the same across current language versions.
- Run `/biteq check` after editing.
- **Importing from another source:** follow "Importing questions" in `formatting-rules.md`, and add every question
  you changed to `docs/import-review.md` with `- [ ] Checked by us` unticked. Only people tick those boxes.
- **Every question has a `practicality` score (1-10);** how to score it is under "Practicality" in `formatting-rules.md`.

## Working agreements

- Agents don't commit or push; people review the diff and commit themselves. Work on a feature branch off `main`.
- Keep `README.md`, `plugins/biteq/README.md` and `docs/flow.md` in step with behaviour changes.
- Match the surrounding code: comments explain *why*, at the density already there.
- Ask before changing anything global (`~/.claude/settings.json`, `~/.claude.json`, real plugin stores).

## Reference

- Engine API (authoritative for the installed Claude Code version):
  `plugins/biteq/.claude-plugin/types/claude-code/index.d.ts`, written by Claude Code when it loads the plugin.
- `docs/flow.md` for how a run moves through the code; `docs/review-notes.md` for known issues.
