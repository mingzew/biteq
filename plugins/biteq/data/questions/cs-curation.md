# CS bank curation notes

For agents (and people) adding, importing or filtering questions in `cs.json`. The loader only reads `*.json`; this
file is not a bank. It records what a human reviewer kept and removed, so future filtering matches their taste.
Read it together with "Practicality" and "Importing questions" in `formatting-rules.md`.

## What happened

On 2026-10-21 a reviewer went through all 189 CS questions (5 hand-written, 184 imported from
freeCodeCamp/Developer_Quiz_Site), removed 111 and kept 78. They left a `comment` on 17 of the kept ones asking for
changes; those were applied, and the comments are still in `cs.json` until the reviewer has checked them.

| | Count | Practicality median | Practicality mean |
|---|---|---|---|
| Removed | 111 | 2 | 2.3 |
| Kept | 78 | 5 | 4.6 |

All 5 hand-written questions were kept (`cs-bigo-doubling`, `cs-in-list`, `cs-lru`, `cs-race-counter`,
`cs-http-idempotent`). They are the model for what this bank should look like: a concrete scenario, often code, and
an answer that changes how you'd write or review code.

## Why questions were removed

The reviewer did not write reasons for removals; these are the patterns in what went. Treat them as filtering
rules. The ids are examples from the original import (see `docs/import-review.md` or the freeCodeCamp source).

### 1. Acronyms and units

Anything that only tests what letters stand for, or unit sizes. Every one of these went.

- What does NFC / GIF / PNG / JPEG / ISP / IDE / SVG / CPU / HTTP / NTFS / API stand for? (`cs-fcc-014`, `-091`,
  `-094`, `-108`, `-107`, `-102`, `-119`, `-082`, `-109`, `-180`, `-071`)
- How many bytes in a kilobyte ... yottabyte? (`cs-fcc-062`, `-064`, `-070`, `-072`, `-074`, `-075`, `-083`, `-110`)
- What is a nibble? (`cs-fcc-121`)

Exception: `cs-fcc-093` (what does DOM stand for) was kept, with a request to explain why the DOM matters. An
acronym survives only when the concept behind it is something developers work with daily, and then the question
should be about the concept.

### 2. Beginner definitions ("What is a ...?")

One-line vocabulary for someone who has never programmed. The reader of this bank already codes for a living or a
hobby.

- What is a bug / an algorithm / a function / a loop / an array / a string / a Boolean / a floating point number /
  pseudocode / an infinite loop? (`cs-fcc-060`, `-067`, `-129`, `-130`, `-131`, `-145`, `-084`, `-061`, `-128`, `-080`)
- Operands, operators, branches, syntax, program, debugging as vocabulary (`cs-fcc-066`, `-087`, `-079`, `-096`,
  `-103`, `-063`, `-035`)

### 3. General computer literacy, hardware and history

Not about writing code at all.

- RAM, CPU, operating system, server, virtual machine, input devices, HDD/SSD, network sizes, pipelining, compiler
  generations (`cs-fcc-077`, `-098`, `-069`, `-065`, `-085`, `-101`, `-104`, `-125`, `-054`, `-135`)
- The internet, the web's inventor and date, passwords, popular operating systems (`cs-fcc-111`, `-105`, `-092`,
  `-086`, `-088`)
- Open source vs proprietary software, pair programming, the design thinking process (`cs-fcc-142`, `-141`, `-081`,
  `-052`, `-112`)

### 4. Design and media topics

Colour models, fonts and image formats: RGB, CMYK, web-safe fonts, WebP, lossy compression, computer vision
(`cs-fcc-089`, `-097`, `-126`, `-090`, `-115`, `-116`, `-004`). `cs-fcc-095` (rgb(255,255,255)) and `cs-fcc-120`
(lossless compression) survived, so this is a strong lean, not an absolute rule.

### 5. Academic graph theory and named-algorithm trivia

Textbook facts you would look up, not reason about while coding.

- Graph vocabulary: arborescence, articulation point / cut vertex, bridge / cut edge, bipartite graphs, adjacency
  list/matrix trivia (`cs-fcc-032`, `-033`, `-024`, `-025`, `-031`, `-029`, `-030`, `-037`)
- Complexities of specialist algorithms: Edmonds-Karp, Bellman-Ford, Floyd-Warshall, Kruskal, Strassen
  (`cs-fcc-002`, `-010`, `-022`, `-165`, `-174`, `-015`)
- Niche algorithms and tree internals: Boruvka, N-Queens, ternary search, AVL balance factor, red-black leaf colour,
  infix-to-postfix (`cs-fcc-023`, `-006`, `-158`, `-011`, `-160`, `-053`, `-176`)
- Theory with no coding decision attached: P vs NP, the halting problem (`cs-fcc-169`, `-178`)

The everyday core of the same topics stayed: Big-O of common operations, hash tables, linked lists, BSTs, the main
sorts, Dijkstra and BFS for shortest paths, recursion, stacks and queues.

### 6. Duplicates of a question that was kept

When two questions test the same idea, the weaker one went, even if its practicality score was decent:

- LIFO stack: `cs-fcc-055` removed, `cs-fcc-181` kept. Push: `cs-fcc-046` removed.
- Stack vs queue: `cs-fcc-173` removed (6) next to the kept LIFO/FIFO questions.
- Binary search: `cs-fcc-171` removed (7), `cs-fcc-140` kept (binary vs linear worst case).
- O(n log n) sorts: `cs-fcc-045` removed, `cs-fcc-007` and `cs-fcc-132` kept.

### 7. Joke or giveaway options

Questions where the wrong options are obviously silly, so the answer is guessable without knowing anything:
"PASSIM" as an operating system, "Apple Pie Inside", the 418 "I'm a teapot" status code, "Why are sorting
algorithms important?" (`cs-fcc-088`, `-147`, `-153`). A question is only worth asking if every wrong option is
something a real developer might believe.

## Removed despite a decent practicality score

These show that practicality alone doesn't decide. Most are duplicates (pattern 6) or definitions phrased so the
long, serious-sounding option is obviously right (pattern 2):

| Id | Practicality | Likely reason |
|---|---|---|
| `cs-fcc-058` first-class functions | 7 | definition; the concept is better tested with code in a language bank |
| `cs-fcc-171` binary search | 7 | duplicate of `cs-fcc-140`; definition-style |
| `cs-fcc-012` call by value | 6 | definition; better as a code question in a language bank |
| `cs-fcc-173` stack vs queue | 6 | duplicate of the kept LIFO/FIFO questions |
| `cs-fcc-038` Dijkstra needs non-negative weights | 5 | named-algorithm fact |
| `cs-fcc-045`, `cs-fcc-055` | 5 | duplicates |
| `cs-fcc-167` Bloom filter | 5 | specialist data structure, definition-style |

## Kept despite a low score

Kept with practicality 1-2: `cs-fcc-124` (logic gates), `cs-fcc-137` (Banker's algorithm), `cs-fcc-155` (B-tree),
`cs-fcc-157` (Morris traversal), `cs-fcc-159` (AVL rotation root), `cs-fcc-162` (red-black basis), `cs-fcc-166`
(bias-variance). Several of these got comments asking for an explanation of how the structure works (B-tree,
red-black tree, bias-variance), so the reviewer values them as a way to learn the concept, provided the explanation
teaches it. Re-score these after the reviewer's second pass.

## What the reviewer's comments asked for

The 17 comments point to a house style for CS questions. Apply it to new questions before a reviewer has to ask:

- **Prefer code over abstract wording.** "Change this to a code example question" (`cs-fcc-139` became
  `cs-recursion-two-calls`; `cs-fcc-151` became `cs-fizzbuzz-order`). Pseudocode is fine. Give the new question a
  descriptive id.
- **Clear, realistic names.** `items`/`allowed`/`x` were "confusing"; now `signups`/`blocked`/`email`. Names in the
  prompt that also appear in the code go in backticks, which the pane highlights.
- **Define the term the question depends on, in the prompt.** Stable sort, the Traveling Salesman tour.
- **Explanations teach the concept, not just restate the answer.** What a B-tree / red-black tree / SOLID / DOM is
  and how it works, what idempotent means, what under- and overfitting mean (with an analogy), and why it matters
  in real work.
- **Explain why a tempting wrong option is wrong**, when a reader could reasonably pick it (`cs-fcc-057`: why array
  insert isn't O(1)).
- **Real-world context:** where kebab case is used, why the DOM matters, where B-trees are used (database indexes).
- **Plausible distractors.** SOLID's wrong options were "a new type of hardware"; they're now other real acronyms
  and principle sets.

## Filtering checklist for new CS questions

Keep a question only if all of these hold:

1. A working developer could meet it while writing, reviewing or debugging code, or it explains a structure they
   use (hash map, B-tree index, linked list) well enough to reason about cost.
2. It is not an acronym, unit, date, person or vocabulary definition.
3. It doesn't duplicate a question already in the bank; if it does, keep the one with code or the clearer scenario.
4. Every wrong option is something a developer might believe.
5. Code or a concrete scenario beats a definition when the idea allows it.
6. The explanation teaches the concept and says why it matters in practice.
