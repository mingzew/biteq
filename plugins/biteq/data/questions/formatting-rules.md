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
  "explanation": "insert_all writes SQL and skips Active Record validations and callbacks.\n\n…"
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

The pane renders `title`, `prompt`, `code`, options, and `explanation` as plain `Text`. `**bold**` and other Markdown do nothing. Do not use Markdown in any of those fields.

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
- Use more than 4 options
- Point explanations at other questions
- Put Markdown in question fields
- Insert blank lines into numbered line-ID snippets
- Load or create extra `.json` files in this directory unless they are a real language bank
