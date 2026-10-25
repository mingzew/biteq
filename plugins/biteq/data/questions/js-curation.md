# JS bank curation notes

For agents (and people) creating, importing or filtering questions in `js.json`. The loader only reads `*.json`;
this file is not a bank. It records what a human reviewer kept, removed and asked to change, so new questions match
their taste. Read it together with "Practicality" and "Importing questions" in `formatting-rules.md`.

## What happened

In October 2026 a reviewer went through `js.json` in PR #14 (mingzew/biteq) and left 70 comments: 50 asked to drop
a question, 14 suggested a better explanation or prompt, and 6 were praise. All of them were applied; the bank went
from 357 to 307 questions.

| Removed | Count | Practicality median | Source |
|---|---|---|---|
| Duplicates of a kept question | 34 | 6 | 24 freeCodeCamp, 10 lydiahallie |
| Contrived, ambiguous or trivia | 16 | 3 | 8 freeCodeCamp, 8 lydiahallie |

The kept bank's practicality median is 5. Duplicates were removed even with high scores (up to 8), so a high score
doesn't protect a question that repeats another.

## Why questions were removed

### 1. Duplicates: one question per idea (34)

The biggest group. When several questions test the same idea, keep the one with real code and a "what does this
print?" answer, and drop definition-style or weaker versions. The kept question for each idea:

| Idea | Kept | Dropped |
|---|---|---|
| `push()` returns the new length | `js-lydia-091` | `js-lydia-074`, `js-fcc-125` |
| `==` vs `===` and coercion | `js-loose-equality` | `js-fcc-006`, `js-fcc-086`, `js-fcc-131` |
| `new Number()` vs a primitive | `js-lydia-007` | `js-fcc-065`, `js-fcc-168` |
| `+` with a string concatenates | `js-lydia-015` | `js-fcc-171`, `js-fcc-178`, `js-fcc-192` |
| Primitive vs object types | `js-fcc-191` | `js-fcc-051`, `js-fcc-150`, `js-fcc-174`, `js-fcc-177` |
| `Set` for unique values | `js-lydia-056` | `js-fcc-144`, `js-fcc-022` |
| Microtasks run before timers | `js-event-loop-order` | `js-fcc-162`, `js-fcc-143` |
| Methods that mutate the array | `js-lydia-108` | `js-lydia-149`, `js-fcc-069` |
| `Object.freeze` is shallow | `js-freeze-shallow` | `js-lydia-075`, `js-lydia-137` |
| Default sort compares strings | `js-default-sort` | `js-fcc-052` |
| `typeof null` | `js-typeof-null` | `js-fcc-120` |
| Unary `+` converts to a number | `js-lydia-004` | `js-fcc-019` |
| Optional chaining `?.` | `js-lydia-119` | `js-fcc-145` |
| Nullish coalescing `??` | `js-fcc-033` | `js-fcc-161` |
| Arrow functions and `this` | `js-lydia-003` | `js-lydia-151` |
| Objects are shared by reference | `js-lydia-006` | `js-lydia-132` |
| Objects as keys become "[object Object]" | `js-lydia-029` | `js-lydia-150` |
| Default parameters re-evaluated per call | `js-lydia-064` | `js-lydia-116` |
| `let` temporal dead zone | `js-lydia-111` | `js-lydia-129` |
| `Object.seal` | `js-lydia-136` | `js-fcc-158` |
| `!typeof x === ...` precedence | `js-lydia-122` | `js-lydia-155` |

**Before adding a question, search the bank for its idea, not its wording.** Imports from different sources repeat
the same handful of JavaScript facts (coercion, equality, `typeof`, the event loop, array mutation), usually phrased
differently: one source asks "what is the difference between == and ===?", another shows code that logs `0 == ""`.

### 2. Code nobody writes (contrived puzzles)

Code that exists only to set up a trick, so the answer teaches nothing you'd use:

- An IIFE inside a template literal (`js-lydia-113`), a "question 100" joke template (`js-lydia-100`), the
  `'b' + 'a' + + 'a'` "banana" trick (`js-fcc-146`).
- Destructuring into an array element inside parentheses (`js-lydia-127`).
- Comparing two identical emoji literals, which is trivially true (`js-lydia-107`).

### 3. Teaches something harmful or runtime-specific

- `delete` on a variable: a SyntaxError in strict mode and modules, so the "answer" relies on sloppy-mode quirks
  (`js-lydia-058`).
- Expected output in invented notation that no runtime prints (`function default()`), and it needs two files
  (`js-lydia-089`).

If a question only holds in non-strict scripts, say so in the prompt (as `js-lydia-009` now does) or drop it.

### 4. Ambiguous: more than one option is right

- `append` and `prepend` also insert children, so only the word "anywhere" picks `insertBefore` (`js-fcc-016`).
- `function` and `class` are keywords, so the "wrong" option is defensible (`js-fcc-176`).
- `console`, `Array` and `Object` as "web APIs" mixes up the term (`js-fcc-038`).
- `JSON.parse()` with no argument throws, contradicting every option (`js-lydia-110`).
- sessionStorage: closing the tab, the browser or the computer all clear it. This one was kept and reworded with
  "Until…" options so only the tab is right (`js-lydia-022`).

Every option must be checked against the code as written: an option a careful reader can defend makes the question
wrong.

### 5. Vocabulary and fill-in-the-blank recall

Tests a word, not understanding: "all objects inherit from a ___" (prototype, `js-fcc-023`), what `debugger` does
(`js-fcc-004`), indexOf vs search (`js-fcc-003`), whether objects and classes are "the same constructs"
(`js-fcc-025`). Prototypes, for example, are covered properly by `js-lydia-014`, with options that make you think.

### 6. Rare edges with broken options

A property with only a setter reads as `undefined` (`js-lydia-121`): a rare edge, and one option was broken
pseudo-code. Quality problems in the options (typos, pseudo-code, "All of the above" fillers, joke options like
`lookupPrefix`) count against a question on their own.

## What makes an explanation good (from the 14 suggestion comments)

The reviewer is not a JavaScript specialist ("good question for a JavaScript noob like myself"), which is the
audience to write for. Their recurring confusions:

- **Define every term the explanation relies on.** "Microtask" and "macrotask", "radix", "tagged template",
  "prototype" were all used without being explained (`js-event-loop-order`, `js-map-parseint`, `js-lydia-017`,
  `js-lydia-011`).
- **Answer the reader's "why", not only the "what".** "I still don't understand how you can call
  Person.getFullName() but member doesn't have it": the fix was to explain lookup on the object and then its
  prototype (`js-lydia-011`). "The answer is undefined but you said it refers to the global object": separate
  where `this` points from what the function returns (`js-lydia-012`).
- **Use one name for one mechanism.** "Event queue", "task queue" and "macrotask queue" are the same thing; pick
  one and say so (`js-lydia-030`).
- **Short, then a commented walkthrough.** Long narrated explanations ("146 words", `js-lydia-046`; the step-by-step
  WebAPI story in `js-lydia-030`) were replaced with one or two sentences plus the code annotated line by line with
  `// =>` and what each line does.
- **Be precise.** "JavaScript unboxes statements" was wrong terminology (`js-lydia-005`); "== only checks the value"
  skipped the conversion (`js-lydia-007`); "they don't have the same reference" contradicted the point
  (`js-lydia-046`). A wrong word in an explanation confuses more than a missing one.
- **Mention the condition the answer depends on**, e.g. non-strict mode, browser vs Node.
- **Show the fix or the right way** at the end (`Person.prototype.getFullName = ...`, `.map((s) => parseInt(s))`).

## What the reviewer liked

Praised without changes: `js-object-key-order`, `js-lydia-003` (arrow functions and `this`), `js-lydia-004` (unary
plus), `js-lydia-006` (shared references), `js-lydia-015`, `js-lydia-016`, `js-lydia-045` (`Promise.race`). These
are short snippets of everyday code with one surprising but explainable result, the model to aim for.

## Checklist for new or imported JS questions

1. The code is something a developer would plausibly write or meet in a code review, not a puzzle built for the
   trick.
2. Its idea isn't already in the bank. Search by concept; if it is, keep whichever has real code, and drop the other.
3. Exactly one option is right for the code as written, including in strict mode and ES modules (or the prompt
   states the condition).
4. No vocabulary, fill-in-the-blank or "what does X stand for" questions.
5. Options are clean: no typos, pseudo-code, joke answers or "All of the above" fillers.
6. The explanation defines its terms, answers why, uses consistent names, is short with a commented walkthrough,
   and ends with the fix or the right pattern.
7. Run the code in node and make the correct option exactly what it prints.
