from flask import Blueprint, request, jsonify
from service.vocab_builder import generate_theme_words, upsert_theme_and_words
import sqlite3
from config.config import EN_DB, DEFAULT_CEFR

theme_bp = Blueprint("theme_bp", __name__, url_prefix="/api/themes")

@theme_bp.route("", methods=["GET"])
def list_themes():
    with sqlite3.connect(EN_DB) as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, name, target_lang, native_lang, cefr_default, created_at FROM themes ORDER BY id DESC")
        rows = cur.fetchall()
        out = [{"id": r[0], "name": r[1], "target_lang": r[2], "native_lang": r[3], "cefr_default": r[4], "created_at": r[5]} for r in rows]
        return jsonify(out)

@theme_bp.route("", methods=["POST"])
def create_theme():
    data = request.get_json(force=True) or {}
    name = data.get("name")
    target_lang = data.get("target_lang", "en")
    native_lang = data.get("native_lang", "pt")

    if not name:
        return jsonify({"error": "name is required"}), 400

    try:
        pack = generate_theme_words(name, target_lang, native_lang)
        theme_id, word_ids = upsert_theme_and_words(pack, target_lang, native_lang)
    except Exception as e:
        return jsonify({"error": "Internal generation error"}), 502

    return jsonify({"theme_id": theme_id, "word_ids": word_ids, "pack": pack}), 201
