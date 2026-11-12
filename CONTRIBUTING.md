# Contributing to BiteQ

Thanks for helping. This page covers how the code is laid out, where to start reading, how to add questions, and the checks every change must pass.

BiteQ is a Claude Code **function-hooks plugin** (`plugins/biteq`). It runs inside Claude Code's own engine: there is one process (the Claude Code session itself), no separate hook process, and no state file or polling. For the product rules and the engine constraints that break things if ignored, read [CLAUDE.md](CLAUDE.md) first. It is written for AI agents and humans alike.

## Where to start

| I want to... | Read |
| --- | --- |
| Add or fix questions, or add a language | [Adding questions](#adding-questions-or-a-language) below |
| Understand the code from scratch | [docs/lesson-plan.md](docs/lesson-plan.md), summarised [below](#code-tour) |
| Trace one run end to end | [docs/flow.md](docs/flow.md) |
| Change behaviour | [CLAUDE.md](CLAUDE.md), then the checks [below](#the-four-checks) |
| See known issues | [docs/review-notes.md](docs/review-notes.md) |
| Understand telemetry | [docs/telemetry.md](docs/telemetry.md) |

## File structure

```
plugins/biteq/
├── hooks/register.ts        entry: registers every engine event; the ONLY file that touches `$`
├── hooks/biteq/
│   ├── client.ts            Client enum (ClaudeCli, ClaudeDesktop) + per-client traits
│   ├── io.ts                the operations modules may perform through the engine
│   ├── cli.ts               /biteq subcommands; signal(): every status change goes through it
│   ├── claude.ts            engine event -> status
│   ├── pane.tsx             questions, answering, resting when done, the bank screen, press(), render()
│   ├── quiz-client.tsx      drawQuiz (shared drawing) + the desktop surface module
│   ├── draw.tsx             re-exports drawQuiz for the hook side
│   ├── quiz.ts              question banks, stats, validation
│   ├── config.ts            remembered languages, pause-when-done
│   ├── store.ts             store keys, JSON helpers, session status
│   ├── debug.ts             event log, on after /biteq debug
│   └── macos.ts             stubs
├── types/index.d.ts         session-state contract ($.state keys the pane draws from)
├── data/questions/*.json    one bank per language; see formatting-rules.md there
├── data/top-stack.json      each bank's hand-picked questions, served first in that order
└── tests/biteq.test.tsx     `claude plugin test`
docs/flow.md                 step-by-step trace of a run through the code
docs/lesson-plan.md          guided tour of the codebase
```

Two rules shape all of it: `$` (the engine handle) never crosses an import, so only `register.ts` uses it and every other module takes an `io` object; and `quiz-client.tsx` must stay self-contained because the desktop app loads it on its own. The reasons are in [CLAUDE.md](CLAUDE.md).

## Code tour

A short version of [docs/lesson-plan.md](docs/lesson-plan.md), which walks the same path in fourteen small steps. Follow the journey from the plugin loading to a question being answered.

**A. Orientation (steps 1–4).** What each file is for, how the engine finds and loads the plugin, `io($)` (the object of small closures that lets modules use the engine without touching `$`), and the state contract: the few `$.state` values the pane draws from. Writing one redraws the pane.

**B. Boot to first paint (steps 5–8).** `session.start` fires, the question banks and remembered language load, the stats come in, the pane opens and the first question is picked. Drawing goes `ui.render` → `view()` → `render()`.

**C. Watching Claude (steps 9–10).** Engine events (`turn.start`, `turn.complete`, tool calls and notifications) become a status in `claude.ts`. When Claude starts working, `onStatus` counts the wait and serves a question.

**D. Answering (steps 11–14).** A click or key arrives as a press, handled by key rather than by closures, so a stale click can't act on the wrong question. `answer()` makes one guarded state write and then does the stats bookkeeping. `next` and `skip` choose the following question. When Claude finishes, the pane rests instead of serving another.

Once you know the pieces, [docs/flow.md](docs/flow.md) traces one run (boot, two prompts, three questions) as a timeline.

## Serving rules

How the next question is chosen and what the pane does at the edges:

- A bank's hand-picked questions (`data/top-stack.json`) are served first, in order, then the rest at random.
- A skipped question comes back only after the rest of the bank, even in a new session.
- Missed questions come back 10% of the time, and only those once nothing is unseen.
- Once every question in the bank is answered, and every missed one answered right since, the pane says "Congratulations!", shows how many of the bank's questions you got right the first time you ever saw them (`✓ ruby  one-shot 35/44`, a perfect bank in the BiteQ colour), and offers **Start over** (`n` in the terminal) or another bank (`z`).
- When Claude is done the pane rests, and the terminal hint bar reads `n: serve next · s: always serve · z: banks · q: close`.

## Adding questions or a language

Questions live in `plugins/biteq/data/questions/<lang>.json`, one JSON array per language, and the language is the filename. To add a language, create `<lang>.json` (`[]` is valid).

Writing a question is mostly about **formatting**, and the rules are detailed. Point your AI assistant at [`plugins/biteq/data/questions/formatting-rules.md`](plugins/biteq/data/questions/formatting-rules.md) and have it follow that file. It covers the layout, the question object, how to space `code`, how to write explanations and prompts, and what not to do.

A few things to know before you start:

- `id` must start with `<lang>-` and be unique across all banks. `options` has 2–4 entries and `answer` is the index of the right one.
- Verify every answer by running the code (for example `ruby -e`), and make the correct option exactly what it prints.
- Run `/biteq check` after editing to validate the banks.
- `data/top-stack.json` is hand-curated, so don't edit it unless asked.

## Workflow

- Work on a feature branch off `main`.
- Agents don't commit or push. People review the diff and commit themselves.
- Keep `README.md` and `docs/flow.md` in step with behaviour changes.
- Every behaviour change gets a test. Check it fails without the change before trusting it.

### The four checks

Run these after every edit. A change isn't finished until all four pass with zero errors.

| # | Check | Command | What it does |
| --- | --- | --- | --- |
| 1 | **Compiles** | `cd plugins/biteq && npx -p typescript@5 tsc -p tsconfig.json` | A strict TypeScript check. It should exit 0 and print nothing. It catches type errors, such as calling a module with the wrong `io` shape or drawing a state key that doesn't exist. |
| 2 | **The engine accepts it** | `claude plugin validate plugins/biteq` | Asks Claude Code itself what it would refuse. It catches engine rules `tsc` can't see, such as using `$` outside `register.ts` or reading state or env with a name that isn't a literal. It should end with `✔ Validation passed`. |
| 3 | **Tests pass** | `claude plugin test plugins/biteq` | Runs `tests/biteq.test.tsx` against the real engine on the terminal, desktop and VS Code surfaces. It should report `0 fail`. |
| 4 | **No stray build output** | `git status` | Confirms no new `.js` files sit next to the `.ts` or `.tsx` sources. If `tsc` emitted them, the generated types are missing (see below). Delete the `.js` files. |

**Generated types.** `tsconfig.json` extends `.claude-plugin/types/tsconfig.json`, which Claude Code writes when it loads the plugin. If that file is missing, `tsc` emits stray `.js` files next to your sources. To create it, start one session with the plugin loaded:

```bash
claude --plugin-dir ./plugins/biteq
```

If your editor shows an error that `tsc` doesn't, find out why (usually a different TypeScript version, or the generated types not existing yet) rather than ignoring either.

The question banks have their own check, `/biteq check`, which is separate from these four.

### Trying your change in a real session

The test kit can't reproduce everything, such as a click from a stale drawing, real focus or layout. For pane layout and keys, also try a real session with `claude --plugin-dir ./plugins/biteq`.

- Exit with `/exit`, never kill `claude`. Killed sessions make Claude Code turn fullscreen off by itself, after which the pane can't dock. If that happens, remove `"fullscreenAutoDisabled"` from `~/.claude.json` and restart.
- Press Esc and confirm the prompt has the keyboard before you type a prompt, or your letters land on pane hotkeys.
- Desktop app sessions load the plugin when they start, so open a new Code session to see a change. The pane title shows the version from `.claude-plugin/plugin.json`; bump it to confirm a new session picked your change up.
- Stats and config live in `~/.claude/plugins/store/biteq_*.json`, shared by every session. Don't leave test runs' changes in your real store.
