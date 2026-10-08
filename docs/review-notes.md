# biteq review notes

A running register of things noticed while reading the code that may warrant a change later. Each
entry records what was found, why it is or is not a defect, and what the fix would be, so that
picking one up later needs no re-investigation.

This is not a bug tracker. An entry stays here once written — when it is fixed or ruled out, its
status says so rather than the entry being deleted. Findings are numbered in the order they were
recorded and keep their number for life.

Every finding is headed by a summary of twenty words or less and a severity:

- **minor** — hygiene, consistency or clarity. Nothing a user can observe.
- **moderate** — wrong or fragile behaviour in a reachable case, with a workaround or a narrow blast
  radius.
- **major** — incorrect behaviour on a common path, lost data, or breakage that reaches other
  plugins or the session.

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | `ui.press` registered without a matcher | minor | Open, deliberately unfixed |
| 2 | User-tier order follows `enabledPlugins`; an outer plugin that skips `next(e)` starves biteq | moderate | Open |
| 3 | Desktop first click is lost: pane unfocused, answering unmounts the Button | major | Fixed 2026-10-07 |

## 1 — [ `ui.press` registered without a matcher, so every press in the session enters biteq's environment | minor ]

**Where** `plugins/biteq-ts/hooks/register.ts:150` · **Found** 2026-10-06

`on('ui.press', ...)` takes no matcher, so every button press in the session is dispatched into
biteq's environment, including presses on elements other plugins drew. The hook filters by hand:

```ts
if (e.plugin !== 'biteq-ts' || e.requestId !== PANE) return next(e)
```

That is correct — anything not ours is passed on with `next(e)` and nothing downstream breaks — but
the filter can be a matcher, exactly as the `ui.render` hook two lines above already does:

```ts
on('ui.press', { plugin: 'biteq-ts', requestId: PANE }, async ($, e) => { ... })
```

`UiPressArgument` carries `plugin`, `element` and `requestId`, and the engine typings give this as
the worked example. Narrowing is behaviour-preserving: every biteq Button is drawn by the single
pane `ui.render` hook, nothing reads other plugins' presses, and the matcher selects the same set
the guard admits. The stale-handle reason for hooking `ui.press` at all is unaffected, since a
matcher changes which events arrive, not where the hook sits in the chain.

What it buys: other plugins' presses stop making a round trip through our environment and spending
that dispatch's budget, and `claude plugin validate` stops reporting biteq as an interceptor of all
UI presses.

**Open question.** Match `plugin` alone instead, so a Button drawn somewhere other than the pane (an
`AbovePrompt` band, a tool row) still reaches `press()` without revisiting this hook.

## 2 — [ User-tier order follows `enabledPlugins`; an outer plugin that skips `next(e)` starves biteq | moderate ]

**Where** Claude Code 2.1.291 `chainOrder` · `plugins/biteq-ts/hooks/register.ts` · **Found** 2026-10-06

**Issue.** biteq-ts only sees an event if every plugin outside it calls `next(e)`. A neighbor that answers without `next(e)` drops that dispatch. biteq cannot observe or repair that from `register.ts`. Core is last on purpose (plugins wrap the engine). Skipping `next` means **this event's** core does not run — not that Claude Code dies. `tool.call` becomes "resolved by a hooks module" (or a shape-error tool result). `prompt.submit` becomes "dropped" / "Prompt not submitted." The session continues. A plugin that does this on every tool or every prompt makes that session's agent or chat unusable until it is disabled.

biteq already answers without `next` on purpose: `/biteq` `command.run`, `prompt.submit` when the text is `/biteq`, and our own pane `ui.press`. Those replace core for that dispatch. Observing hooks (`turn.*`, `tool.call`, `session.start`) must `next(e)`.

**Cause.** First in the chain is outermost. biteq-ts is unmanaged, so it loads in the **user** tier. In that tier, with no `plugin.json` `dependencies`, Claude does not sort by name. It walks `Object.entries` on merged `enabledPlugins`. First key is outer. `--plugin-dir` session plugins sit outside marketplace plugins. A committed repo `.claude/settings.json` cannot put biteq in prepend (user/policy only) and cannot jump it ahead of keys the user already has.

**Tiers** (outer to inner):

- **prepend** — `prependPlugins` and org-seated managed plugins; runs first.
- **user** — Unmanaged installed plugins (biteq-ts); `enabledPlugins` order, then `dependencies`.
- **append** — `appendPlugins`; after user, before builtin and core.
- **builtin** — Plugins Claude Code ships.
- **core** — The engine's handler for this dispatch. No `next(e)` means it is not reached.

**Mitigation.** Put `biteq-ts` first in `enabledPlugins`, or in `prependPlugins` in `~/.claude/settings.json`. Confirm a swallow with `claude --debug` and `~/.claude/debug/<session-id>.txt` (`without next()`, `resolved by a hooks module`, `prompt.submit: dropped`). Host-order workaround, not a biteq bug.

## 3 — [ Desktop first click is lost: pane unfocused, answering unmounts the Button | major ]

**Where** `plugins/biteq-ts/hooks/biteq/pane.tsx` (`onStatus`, `render`) · **Found** 2026-10-07 · **Fixed** 2026-10-07

On Claude Code Desktop, the first click on an option or Next did nothing; a click on the pane body first, then the button, worked. Terminal was fine. This is not the stale-`onPress` race (finding's cousin in `ui.press` by key). `ui.press` never fired: the desktop pane is a separate region, and macOS delivers the first click on an unfocused region as activate-only.

Two plugin choices made it repeat after every answer. Boot and `thinking` called `openPane(false)`, so the prompt kept focus after submit. Answering then replaced option `Button`s with `Text` under the same keys, unmounting the native control that held focus and giving it back to the prompt. The done/waiting toasts could steal it a third time.

**Fix.** On desktop, `thinking` asks `open({ focus: true })` (granted only while the composer is empty). Answered options stay `Button`s. After a press, `$.ui.focus` moves the ring onto Next or the next question's first option. Status toasts are gone; the banner already says the same thing.

**Open question.** If the first click after a prompt still only focuses the pane, Desktop is swallowing mouse-down before `ui.press`. That is an engine/`acceptsFirstMouse` gap; a plugin cannot set it.

## Adding a finding

Give it the next number and add a row to the table. Head it as:

```md
## 4 — [ summary of twenty words or less | minor ]
```

Keep the body under 200 words. Say where it is by file and line, whether it is a defect or hygiene,
and what the fix would be — a reader should be able to act without reopening the investigation.
Leave any unresolved decision under an **Open question** heading rather than picking silently.
