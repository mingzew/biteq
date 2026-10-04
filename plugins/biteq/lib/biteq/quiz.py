"""Question banks (one JSON file per language) and the stats file.

Bank layout: data/questions/<lang>.json, each a JSON array of
    {id, title, prompt, code, options[2-4], answer (index), explanation}
The language is the filename; it is added to each question as q["lang"] when loaded.
Question ids must start with "<lang>-" and be unique across all banks.
"""
import json
import os
from pathlib import Path

from .store import STATS, load_json

QUESTIONS_DIR = Path(os.environ.get(
    "BITEQ_QUESTIONS",
    str(Path(__file__).resolve().parents[2] / "data" / "questions")))

DEFAULT_STATS = {
    "answered": 0, "correct": 0, "streak": 0, "best_streak": 0,
    "waits": 0, "engaged_waits": 0, "seen": [], "wrong": [], "by_lang": {},
}

REQUIRED = ("id", "prompt", "options", "answer", "explanation")


def load_stats():
    return dict(DEFAULT_STATS, **load_json(STATS, {}))


def bank_files():
    return sorted(QUESTIONS_DIR.glob("*.json"))


def load_bank(path):
    """Questions from one bank file, each tagged with q["lang"]."""
    questions = json.loads(path.read_text())
    for q in questions:
        q["lang"] = path.stem
    return questions


def language_counts():
    """{lang: question_count} for every bank file, including empty ones."""
    return {p.stem: len(load_bank(p)) for p in bank_files()}


def load_questions(langs):
    """All questions for the given languages (unknown/empty languages contribute none)."""
    out = []
    for path in bank_files():
        if path.stem in langs:
            out += load_bank(path)
    return out


def validate():
    """Returns (summary, errors) for the whole question directory."""
    errors, ids, counts = [], {}, {}
    files = bank_files()
    if not files:
        return "no question banks found in %s" % QUESTIONS_DIR, ["no *.json files"]
    for path in files:
        lang = path.stem
        try:
            questions = json.loads(path.read_text())
        except Exception as e:
            errors.append("%s: invalid JSON (%s)" % (path.name, e))
            continue
        if not isinstance(questions, list):
            errors.append("%s: top level must be an array" % path.name)
            continue
        counts[lang] = len(questions)
        for i, q in enumerate(questions):
            qid = q.get("id", "%s#%d" % (lang, i))
            for key in REQUIRED:
                if key not in q:
                    errors.append("%s: missing %s" % (qid, key))
            if not str(qid).startswith(lang + "-"):
                errors.append("%s: id must start with '%s-'" % (qid, lang))
            if qid in ids:
                errors.append("%s: duplicate id (also in %s)" % (qid, ids[qid]))
            ids[qid] = path.name
            n = len(q.get("options", []))
            if not 2 <= n <= 4:
                errors.append("%s: needs 2-4 options" % qid)
            if not 0 <= q.get("answer", -1) < n:
                errors.append("%s: answer out of range" % qid)
    summary = "%d questions in %d banks: %s" % (
        sum(counts.values()), len(counts),
        ", ".join("%s %d" % (k, v) for k, v in sorted(counts.items())))
    return summary, errors
