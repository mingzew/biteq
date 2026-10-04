"""User config in ~/.biteq/config.json. Currently just the remembered language choice."""
from .store import CONFIG, load_json, save_json

DEFAULT_LANGS = ["python"]


def load():
    return load_json(CONFIG, {})


def get_langs():
    langs = load().get("langs")
    return langs if isinstance(langs, list) and langs else list(DEFAULT_LANGS)


def set_langs(langs):
    cfg = load()
    cfg["langs"] = list(langs)
    save_json(CONFIG, cfg)
