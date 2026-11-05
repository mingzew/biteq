# Python bank curation notes

For agents (and people) adding, importing or filtering questions in `python.json`. The loader only reads `*.json`;
this file is not a bank. It records what a human reviewer kept, removed and asked to change, so future filtering
matches their taste. Read it together with "Practicality" and "Importing questions" in `formatting-rules.md`.

## What happened

On 2026-11-04 a reviewer went through all 173 Python questions (12 hand-written, 161 imported from
freeCodeCamp/Developer_Quiz_Site), removed 109 and kept 64. They asked for changes to 9 of the kept ones; those were
applied.

| | Count | Practicality median | Practicality mean |
|---|---|---|---|
| Removed | 109 | 5 | 4.7 |
| Kept | 64 | 6 | 6.3 |

The score barely separates them: 40 of the 109 removals scored 6 or higher (`python-fcc-019` scored 9). Judge the
question, not the number.

All 12 hand-written questions were kept (`python-mutable-default`, `-late-binding`, `-is-vs-eq`, `-dict-hash-collide`,
`-slice-step`, `-generator-exhausted`, `-finally-return`, `-floor-div-negative`, `-list-multiply-alias`,
`-mutate-while-iterating`, `-regex-greedy`, `-binary-search-bug`). They are the model: short real code, a trap people
meet in practice, and an answer that changes how you'd write or review code.

## Why questions were removed

The reviewer mostly gave no reasons for removals; these are the patterns in what went. Treat them as filtering
rules. Ids are `python-fcc-<n>`.

### 1. Trivia: history, people, versions, limits

When Python appeared (`046`), who made it (`091`), the maximum identifier length (`125`), which version added
`math.perm()` (`151`), what CPython is (`045`), Tim Sort (`127`), the `.py` extension (`098`), which paradigms Python
supports (`117`), Tkinter (`144`), the `cmd` module (`021`).

### 2. Symbol, keyword and name recall

Pick the obvious name from four. Operators (comparison `044`, `052`, `076`, `087`; bitwise `007`, `011`, `012`,
`013`, `092`; arithmetic `057`, `062`, `071`; `075`, `104`, `126`), exception names (`061`, `066`, `077`, `109`,
`112`), keywords (`054`, `059`, `074`, `089`), and "which function does X" (`003`, `025`, `035`, `041`, `053`, `055`,
`056`, `060`, `063`, `079`, `094`, `102`, `107`, `108`, `111`, `113`, `116`, `128`, `131`) plus module names (`015`,
`022`, `080`, `110`).

Exception: `103` (RecursionError) stayed, because that error is not the obvious guess.

### 3. Vocabulary and definitions

"Truthy" and "falsy" (`040`, `042`, `064`, `114`), attribute vs property (`051`), what `pass` is called (`120`),
`dir()` (`133`), naming style (`096`), "which is not a built-in type or method" (`027`, `130`, `152`, `153`, `154`,
`156`). Kept: `028`, `032`, `033`, `070`, `100`.

### 4. Contrived or trivial output puzzles

Code that exists only to set up a trick, or whose answer needs no Python knowledge: `145`, `149` (`[:2:]`), `139`,
`050` (`'Hi' * 2`), `010` (`'free' + 'code camp'`), `008` (`type('...')`), and the "Hello, World" and "define a
variable" questions (`037`, `068`, `069`, `072`, `097`). Kept: `029` (the stop index is exclusive), `030`, and the
hand-written `python-finally-return` and `python-dict-hash-collide`.

### 5. Duplicates

When two questions test the same idea, the weaker one went: three list-reversal questions (`019`, `132`, `143`; `020`
kept), `134` next to `147` (`%.2f`), `089` next to `036` (defining a function), `038` and `065` next to `039` (empty
collections).

### 6. Joke or giveaway options

Wrong answers nobody would believe: `'??'`, "Unstoppable", `piip`, `iterate()`, `.end()`. A question is only worth
asking if every wrong option is something a real developer might believe.

### 7. Wrong or version-dependent

`014` (`int.bit_count()` only exists from Python 3.10, so the answer changes with the version) and `155` (the code
used `math.pow` without importing `math`, so two options failed).

## Removed despite a decent practicality score

| Id | Practicality | Likely reason |
|---|---|---|
| `019` which list method changes the list | 9 | same idea as the kept reversal question; asks for a name |
| `102` `zip` | 8 | obvious answer next to `iterate()`, `print()`, `range()` |
| `093` what `input()` returns | 8 | trivial; same family as `025` |
| `143` reverse a list | 7 | duplicate |
| `112` the KeyError name | 7 | exception-name recall |
| `010` `'free' + 'code camp'` | 7 | trivial output |

## Kept despite a low or borderline score

`032` and `033` (3), `python-dict-hash-collide` (3, hand-written). A second pass could still look at `084`, `090`,
`101`, `138` (mutability), `099` (indentation), `085` (`all()`), `001`, `002`, `115` and `161`.

## What the reviewer's edits asked for

- **One clear answer and a precise prompt.** `017` now asks for the last item "without removing it", because
  `pop()` also returns it. `132` was dropped for the same ambiguity (a slice copies, it doesn't reverse in place).
- **Code that runs as written.** Show the imports it needs. Never name a variable after a built-in (`009` used
  `list`; it is now `names`).
- **Balanced options.** The right answer must not be the longest (`026`).
- **Explanations are short.** One or two sentences of why, plus the fix when there is one. Add a commented snippet
  with `# =>` outputs only when the code explains it better than words (a shallow copy, `[::-1]`, `'%.3f'`); when
  one sentence says it all, stop there. The reviewer trimmed anything the snippet already explains (a `Counter`
  example, `%d`, a `.reverse()` contrast) and cut the snippet from most new questions. For syntax such as `[::-1]`
  or `'%.3f'`, say what each symbol does.
- **Neutral example strings.** `sentence='BiteQ 4Eva'` replaced a freeCodeCamp-specific string.
- **Typos.** `023` had a stray space before the question mark.
- **Verify by running.** Every output in a prompt or explanation was run before it went in.

## Filtering checklist for new Python questions

Keep a question only if all of these hold:

1. A working developer could meet it while writing, reviewing or debugging Python.
2. It is not trivia, a date, a person, a version, a keyword or symbol, or a vocabulary definition.
3. It doesn't duplicate a question already in the bank; if it does, keep the one with code or the clearer scenario.
4. Every wrong option is something a developer might believe, and no option stands out by length.
5. Code, run as written, beats a definition when the idea allows it.
6. The explanation says why in as few words as it can, with a commented snippet only when it helps.

When you remove an imported question, delete its entry in `docs/import-review.md` (if it has one) and fix the
section counts.
