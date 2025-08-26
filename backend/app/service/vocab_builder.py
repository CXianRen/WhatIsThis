import json, sqlite3
from datetime import datetime
from config.config import DEFAULT_CEFR
from service.deepseek import llm_json
from models.database import get_db_path  # <-- per-language DB

def _fallback_heads(theme_name: str):
    t = theme_name.lower()
    if "foot" in t or "soccer" in t:
        return ["football","match","team","player","coach","goal","referee","stadium","league","tactics",
                "pass","shot","defense","midfield","striker","substitute","corner","penalty","offside","kickoff",
                "whistle","injury","extra time","final","trophy"]
    return ["topic","conversation","practice","idea","question","answer","example","context","phrase","expression",
            "dialogue","speaker","listener","voice","pronunciation","vocabulary","sentence","grammar","turn","reply",
            "clarify","repeat","review","summarize","conclude"]

def generate_theme_words(theme_name: str, target_lang: str) -> dict:
    prompt = f"""
Return STRICT JSON with 25 {target_lang} vocabulary items (single words or short phrases) for the theme "{theme_name}".
Schema exactly:
{{
  "theme": "{theme_name}",
  "words": ["item1","item2", "... (total 25)"]
}}
Only JSON.
""".strip()
    try:
        data = llm_json(prompt, temperature=0.2, max_tokens=300, timeout_s=60, force_json=True)
        words = data.get("words", [])
        if not isinstance(words, list) or len(words) < 10: raise ValueError("too few words")
        heads = [str(w).strip() for w in words if str(w).strip()]
    except Exception:
        heads = _fallback_heads(theme_name)
    return {"theme": theme_name, "words": heads[:25]}

def upsert_theme_and_words(theme_pack: dict, target_lang: str, native_lang: str) -> tuple[int, list[int]]:
    theme = theme_pack["theme"]; heads = theme_pack["words"]
    db_path = get_db_path(target_lang)

    with sqlite3.connect(db_path) as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO themes(name, target_lang, native_lang, cefr_default, created_at) VALUES (?, ?, ?, ?, ?)",
            (theme, target_lang, native_lang, DEFAULT_CEFR, datetime.utcnow().isoformat())
        )
        theme_id = cur.lastrowid

        word_ids = []
        for head in heads:
            payload_json = json.dumps({"head": head}, ensure_ascii=False)
            cur.execute(
                "INSERT OR IGNORE INTO words(head, lang, pos, cefr, payload_json) VALUES (?, ?, NULL, ?, ?)",
                (head, target_lang, DEFAULT_CEFR, payload_json)
            )
            cur.execute("SELECT id FROM words WHERE head=? AND lang=?", (head, target_lang))
            wid = cur.fetchone()[0]
            word_ids.append(wid)
            cur.execute("INSERT OR IGNORE INTO theme_words(theme_id, word_id) VALUES (?, ?)", (theme_id, wid))

        conn.commit()
        return theme_id, word_ids
