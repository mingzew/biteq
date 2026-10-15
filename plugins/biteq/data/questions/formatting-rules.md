# Question bank formatting

For agents editing files in this directory. The loader only reads `*.json`; this file is not a bank.

## Layout

One JSON file per language: `ruby.json`, `python.json`, `bash.json`, …

- Language is the filename (no `.json`). Do not put `"lang"` on a question; it is added at load time.
- The pane tag is that filename, e.g. `[ruby]`. Rails questions live in `ruby.json` on purpose.
- Ids must start with `<lang>-` (`ruby-for-leaks`, `python-mutable-default`) and be unique across every bank.
- Validate with `/biteq check`.

Each file is a JSON **array** of question objects.

## Question object

```json
{
  "id": "ruby-rails-insert-all",
  "title": "insert_all vs validates",
  "prompt": "The name column allows NULL. Who stops this?",
  "code": "create_table :users do |t|\n  t.string :name\nend\n\nclass User < ApplicationRecord\n  validates :name, presence: true\nend\n\nUser.insert_all([{ name: nil }])",
  "options": ["Active Record", "Nobody (it inserts)", "Action Controller", "The database"],
  "answer": 1,
  "explanation": "insert_all writes SQL and skips Active Record validations and callbacks.\n\n…",
  "practicality": 7
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | `<lang>-` prefix, unique |
| `title` | no | Short label. Shown after `[ruby]`. Do not put the tag in the title. |
| `prompt` | yes | The question. Must not give away the answer. |
| `code` | no | Snippet shown under the prompt. Use `\n` for newlines. |
| `options` | yes | 2–4 strings. Mix which index is correct; do not always use `0` or last. |
| `answer` | yes | 0-based index into `options`. |
| `explanation` | yes | Shown after they pick. See below. |
| `practicality` | yes | Whole number 1–10. See [Practicality](#practicality). |
| `source` | imports | Where an imported question came from, e.g. `"lydiahallie/javascript-questions #12"`. Not shown. See [Importing questions](#importing-questions). |

The pane renders `title`, `prompt`, `code`, options, and `explanation` as plain `Text`. `**bold**` and other Markdown do nothing. Do not use Markdown in any of those fields.

## Practicality

The bank exists to keep coding skills sharp for professional and hobby coders who now write less code by hand. Prefer code people will actually see and write over "gotcha" or "what would this even do" puzzles. `practicality` (1-10) records how close a question is to that goal.

### How we score it

Ask, in this order, and take the first row that fits:

| Score | Ask | Examples |
|---|---|---|
| 9-10 | Would someone write or review this exact code this week, or hit this bug in real work? | `[10, 9, 1].sort()`, mutable default arguments, `forEach` with `async`, `LEFT JOIN` + `WHERE`, `find_by` vs `find` |
| 6-8 | Is it an everyday API, or a well-known gotcha people do run into? | `splice` vs `slice`, `??`, `push()` returning the length, `0.1 + 0.2`, `Hash.new([])` |
| 3-5 | Is it real but uncommon: a language corner, data-structure theory, a rarely used API? | generators, `Object.defineProperty`, Big-O of a textbook algorithm, Ruby variable sigils |
| 1-2 | Is it trivia, history, a definition to memorise, or contrived code nobody writes? | "When did Python first appear?", bytes in a zettabyte, `typeof typeof 1`, emoji string tricks |

Then adjust by one point at most:

- **Up** if the trap causes silent wrong results in production (data loss, a wrong total, a missed await) rather than a loud error.
- **Down** if the code only exists to set up the trick (names like `foo`/`bar`, chains no one would write), or the answer depends on one runtime (browser-only output, console formatting).

Score the question as asked, not its topic: "What does `typeof []` return?" is practical; "How many falsy values are there?" is trivia about the same idea. Score quickly; a person reviews the scores, in [docs/import-review.md](../../../../docs/import-review.md) for imports or in the diff for hand-written questions.

## Importing questions

Every question brought in from another source must be converted to this format before it lands in a bank. `/biteq check` must pass.

1. **Licence.** Only import from sources whose licence allows it (MIT, BSD, CC BY, …). Add the source, commit and full licence text to `ATTRIBUTION.md`, and list what you changed.
2. **Ids and source.** Ids are `<lang>-<source>-<n>` (`js-lydia-012`, `python-fcc-045`), with `<n>` the question's number in the source. Set `source` to `"<owner>/<repo> <file> #<n>"`.
3. **Exactly 4 options and an explanation.** Bring 2- and 3-option questions up to 4 with plausible wrong answers; cut 5+ options down to 4. Every option must differ. Add an explanation where the source has none.
4. **Shuffle the answer.** Sources often put the correct answer first. Spread `answer` across 0–3; keep "All of the above" / "None of the above" last.
5. **No language prefix.** The pane already shows `[python]`, so drop "In Python," / "In JavaScript," and similar. Keep the name where the language is the subject ("Who created Python?").
6. **Code goes in `code`.** Move code that the source put in the prompt into `code`, one statement per line, and reword the prompt ("What does this print?").
7. **Plain text.** Strip Markdown, HTML, backticks and escapes (`\$`, `&nbsp;`). Drop image references and pointers to other questions or articles; rewrite the sentence so it stands alone.
8. **Verify, then fix.** Run every snippet (`python3`, `node`, `ruby -e`) and make the correct option exactly what it prints. Fix wrong answers and explanations, and replace a wrong option that is also correct. For browser-only behaviour, say so in the prompt ("in a browser").
9. **Drop** duplicates (of the source or of the bank) and questions with no coherent answer, and note them in `ATTRIBUTION.md`.
10. **Score `practicality`** for every question (see [Practicality](#practicality)).
11. **Record it for review.** Add the source to the Imports table in [docs/import-review.md](../../../../docs/import-review.md), and an entry for every question whose answer, options, prompt or explanation you changed: the source's version, ours, a one-line *Why*, whether the explanation was rewritten, the practicality, and an unticked `- [ ] Checked by us`. Never tick that box yourself; a person does after reviewing.

## `code` spacing (Ruby / similar)

Blank line after a **class** or **module** `end` when more code follows (another class, a call, `p …`).

```ruby
class A
  def f(n)
    n
  end
end

class B < A
  def f(n)
    super()
  end
end

p B.new.f(2)
```

Do **not** add a blank line after a method `end`. `def` / `end` stays tight, including the class `end` that follows it:

```ruby
class D
  def hi
    "hi"
  end
end
```

Blank line between **separate top-level calls** (or a long call and the next statement):

```ruby
post = Post.includes(:comments)
           .where(comments: { approved: true })
           .find(1)

p post.comments.size
```

Schema, class, then a call are three groups — blank line between each:

```ruby
create_table :users do |t|
  t.string :name
end

class User < ApplicationRecord
  validates :name, presence: true
end

User.insert_all([{ name: nil }])
```

Leave numbered “spot the line” snippets unchanged. Extra blank lines would shift line numbers, which are the answers:

```
1  class Animal
2    @@legs = 4
…
4  end
5  class Dog < Animal
```

Tight setup → mutate → print sequences stay tight (`x = 1` then `[2].each { |x| }` then `p x`). Top-level `def` / `end` then `p method` is the same as a method: no extra blank after `end`.

## Explanations

1. One or two sentences of **why**.
2. Blank line, then the snippet again with **comments on each step** (`# =>` and what that line does).
3. Contrast a related gotcha **inline as code**, not as a pointer to another question.

```
A block parameter |x| is a new local. It does not write the x you assigned above.

x = 1                 # this x holds 1
[2].each { |x| }      # a different x, only inside the block; 2 goes here, then gone
p x                   # => 1  — the first x is still 1

for x in [2]; end     # would put 2 in the first x
```

Do not write cross-references to other questions. Questions are served one at a time, in random order.

Use `\n` for a line break and `\n\n` between the why and the commented code. No `**`, no HTML.

## Prompt wording

A single small word must not carry the whole trap (`no NOT NULL` is easy to misread). Front-load the fact: `The name column allows NULL. Who stops this?`

## Do not

- Add `"lang"` or `"difficulty"` to the JSON
- Add a question without `practicality`
- Use more than 4 options
- Point explanations at other questions
- Put Markdown in question fields
- Insert blank lines into numbered line-ID snippets
- Load or create extra `.json` files in this directory unless they are a real language bank
