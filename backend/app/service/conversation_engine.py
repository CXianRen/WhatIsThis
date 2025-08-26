import json, re, sqlite3, random
from service.session_memory import get, set_, new_session, append_history, get_history
from service.deepseek import llm_json
from models.database import get_db_path

def _load_theme(lang: str, theme_id: int):
    with sqlite3.connect(get_db_path(lang)) as conn:
        c = conn.cursor()
        c.execute("SELECT id, name, target_lang, native_lang FROM themes WHERE id=?", (theme_id,))
        row = c.fetchone()
        if not row: return None
        c.execute("""SELECT w.head FROM words w
                     JOIN theme_words tw ON tw.word_id=w.id
                     WHERE tw.theme_id=? ORDER BY w.id ASC""", (theme_id,))
        heads = [r[0] for r in c.fetchall()]
        return {"id": row[0], "name": row[1], "target_lang": row[2], "native_lang": row[3], "words": heads}

def create_session(starter="ai", cefr="A2", target_lang="en", native_lang="pt") -> str:
    return new_session(starter, cefr, target_lang, native_lang)

def list_themes(lang: str):
    with sqlite3.connect(get_db_path(lang)) as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, name, target_lang FROM themes ORDER BY id DESC")
        return [{"id": r[0], "name": r[1], "target_lang": r[2]} for r in cur.fetchall()]

def handle_turn(session_id: str, user_text: str | None):
    s = get(session_id)
    if not s: return {"error":"invalid_session"}
    state = s["state"]; target_lang = s["target_lang"]; native_lang = s["native_lang"]

    # Phase 1: ask/pick theme
    if state == "await_theme_choice":
        if not user_text:
            themes = list_themes(target_lang)
            if themes:
                names = "\n".join([f'[{t["id"]}] {t["name"]} ({t["target_lang"]})' for t in themes])
                ai = "Say 'new theme' and tell me the topic, or pick a saved one by ID:\n" + names
            else:
                ai = "Say 'new theme' and tell me the topic."
            append_history(session_id, "ai", ai)
            return {"ai_text": ai, "state": state}

        lt = (user_text or "").strip().lower()
        append_history(session_id, "user", user_text)

        if "new" in lt:
            set_(session_id, state="await_new_theme")
            ai = "Great — what theme would you like?"
            append_history(session_id, "ai", ai)
            return {"ai_text": ai, "state": "await_new_theme"}

        m = re.search(r"\b(\d+)\b", lt)
        if m:
            theme = _load_theme(target_lang, int(m.group(1)))
            if theme:
                set_(session_id, state="in_conversation",
                     theme_id=theme["id"], theme_name=theme["name"],
                     unused_words=theme["words"][:], all_words=theme["words"][:])
                if s["starter"] == "ai":
                    out = _ai_reply_using_words(session_id, None)
                    append_history(session_id, "ai", out["ai_text"])
                    return {**out, "state":"in_conversation", "progress": _progress(session_id)}
                ai = f"Theme '{theme['name']}' ready — you start! What's your first question or opinion?"
                append_history(session_id, "ai", ai)
                return {"ai_text": ai, "state":"in_conversation", "progress": _progress(session_id)}
            ai = "I couldn't find that theme ID. Say 'new theme' or reply with a valid ID."
            append_history(session_id, "ai", ai)
            return {"ai_text": ai, "state": state}

        ai = "Say 'new theme' or reply with a theme ID (e.g., 3)."
        append_history(session_id, "ai", ai)
        return {"ai_text": ai, "state": state}

    # Phase 2: create a new theme
    if state == "await_new_theme":
        topic = (user_text or "").strip()
        if not topic:
            ai = "Tell me the theme you'd like."
            append_history(session_id, "ai", ai)
            return {"ai_text": ai, "state": state}

        append_history(session_id, "user", topic)
        from service.vocab_builder import generate_theme_words, upsert_theme_and_words
        pack = generate_theme_words(topic, target_lang)
        theme_id, _ = upsert_theme_and_words(pack, target_lang, native_lang)
        theme = _load_theme(target_lang, theme_id)

        set_(session_id, state="in_conversation", theme_id=theme_id,
             theme_name=theme["name"], unused_words=theme["words"][:], all_words=theme["words"][:])

        if s["starter"] == "ai":
            out = _ai_reply_using_words(session_id, None)
            append_history(session_id, "ai", out["ai_text"])
            return {**out, "state":"in_conversation", "progress": _progress(session_id)}
        ai = f"Theme '{theme['name']}' created — you start! What aspect interests you?"
        append_history(session_id, "ai", ai)
        return {"ai_text": ai, "state":"in_conversation", "progress": _progress(session_id)}

    # Phase 3: conversation
    if state == "in_conversation":
        if user_text: append_history(session_id, "user", user_text)
        out = _ai_reply_using_words(session_id, user_text or "")
        append_history(session_id, "ai", out["ai_text"])
        return {**out, "state":"in_conversation", "progress": _progress(session_id)}

    return {"error": f"unhandled_state {state}"}

def _pick_words(unused: list[str], max_n: int = 2) -> list[str]:
    if not unused: return []
    n = min(max_n, len(unused))
    pool = unused[: min(8, len(unused))]
    random.shuffle(pool)
    return pool[:n]

def _ai_reply_using_words(session_id: str, user_text: str | None):
    s = get(session_id)
    target_lang = s["target_lang"]; theme_name = s["theme_name"]
    unused = s["unused_words"]; history = get_history(session_id)

    planned = _pick_words(unused, max_n=2)
    last_user = (user_text or "").strip()

    prompt = f"""
Act as a friendly {target_lang} partner in the theme "{theme_name}".
Rules:
- Answer briefly (1–2 sentences), then ask EXACTLY ONE short question.
- If natural, weave in up to 2 of these words: {planned}. Otherwise skip.
- Stay on theme. Be specific and interactive with the user's last message.
Return STRICT JSON:
{{ "ai_text": "...", "used_words": ["w1","w2"] }}
History (last few turns): {json.dumps(history[-6:], ensure_ascii=False)}
User_last: {json.dumps(last_user, ensure_ascii=False)}
Only JSON.
""".strip()

    try:
        data = llm_json(prompt, temperature=0.6, max_tokens=140, timeout_s=45, force_json=True)
        ai_text = (data.get("ai_text") or "").strip()
        used = [w for w in (data.get("used_words") or []) if isinstance(w, str)]
        if "?" not in ai_text: ai_text = (ai_text + " What do you think?").strip()
    except Exception:
        used = planned[:1]
        base = f"Let's focus on {theme_name}."
        q = "What’s your opinion about it?" if last_user else "How would you start?"
        ai_text = f"{base} {q}"

    lowered = {w.lower() for w in used}
    s["unused_words"] = [w for w in s["unused_words"] if w.lower() not in lowered]
    return {"ai_text": ai_text, "used_words": used}

def _progress(session_id: str) -> dict:
    s = get(session_id)
    lang = s["target_lang"]
    all_words = s.get("all_words")
    if all_words is None:
        with sqlite3.connect(get_db_path(lang)) as conn:
            c = conn.cursor()
            c.execute("""SELECT w.head FROM words w
                         JOIN theme_words tw ON tw.word_id=w.id
                         WHERE tw.theme_id=? ORDER BY w.id ASC""", (s["theme_id"],))
            all_words = [r[0] for r in c.fetchall()]
            set_(session_id, all_words=all_words[:])

    unused = s.get("unused_words", [])
    used = [w for w in all_words if w not in unused]
    return {"remaining": len(unused), "total": len(all_words),
            "words_all": all_words, "words_used": used, "words_unused": unused}
