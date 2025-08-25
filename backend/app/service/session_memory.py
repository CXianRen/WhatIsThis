import uuid
from typing import Dict, Any, List

_SESS: Dict[str, Dict[str, Any]] = {}

def new_session(starter: str = "ai", cefr: str = "A2",
                target_lang: str = "en", native_lang: str = "pt") -> str:
    sid = str(uuid.uuid4())
    _SESS[sid] = {
        "state": "await_theme_choice",
        "starter": starter,
        "cefr": cefr,
        "target_lang": target_lang,
        "native_lang": native_lang,
        "theme_id": None,
        "theme_name": None,
        "unused_words": [],   # heads not yet used in this session
        "all_words": None,    # cached full list for the chosen theme
        "total_words": None,  # cached int
        "history": []         # ephemeral (last ~12 messages), not persisted
    }
    return sid

def get(sid: str) -> dict | None:
    return _SESS.get(sid)

def set_(sid: str, **fields):
    if sid in _SESS:
        _SESS[sid].update(fields)

def append_history(sid: str, role: str, text: str):
    s = _SESS.get(sid)
    if not s:
        return
    h: List[dict] = s.setdefault("history", [])
    h.append({"role": role, "text": (text or "").strip()})
    # keep last 12 messages (≈6 exchanges)
    if len(h) > 12:
        del h[: len(h) - 12]

def get_history(sid: str) -> list[dict]:
    s = _SESS.get(sid)
    return [] if not s else list(s.get("history", []))

def delete(sid: str):
    _SESS.pop(sid, None)
