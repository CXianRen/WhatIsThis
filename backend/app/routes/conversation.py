from flask import Blueprint, request, jsonify
from service.conversation_engine import create_session, handle_turn

conversation_bp = Blueprint("conversation_bp", __name__, url_prefix="/api/conversation")

@conversation_bp.route("/start", methods=["POST"])
def start():
    data = request.get_json(force=True) or {}
    starter = data.get("starter", "ai")
    cefr = data.get("cefr", "A2")
    target_lang = data.get("target_lang", "en")
    native_lang = data.get("native_lang", "pt")
    session_id = create_session(starter, cefr, target_lang, native_lang)
    out = handle_turn(session_id, None)
    out["session_id"] = session_id
    return jsonify(out)

@conversation_bp.route("/turn", methods=["POST"])
def turn():
    data = request.get_json(force=True) or {}
    session_id = data.get("session_id")
    user_text = data.get("user_text")
    if not session_id:
        return jsonify({"error": "session_id required"}), 400
    out = handle_turn(session_id, user_text)
    return jsonify(out)
