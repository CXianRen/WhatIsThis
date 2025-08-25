import json, requests, traceback
from requests.adapters import HTTPAdapter, Retry
from config.config import TRANSLATION_API_KEY, TRANSLATION_API_URL, DEEPSEEK_MODEL

# one shared session with retries and backoff
_session = requests.Session()
_session.mount(
    "https://",
    HTTPAdapter(
        max_retries=Retry(
            total=3, connect=3, read=3,
            backoff_factor=0.6,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST"]
        )
    )
)

def clean_json_block(s: str) -> str:
    s = s.strip()
    starts = [i for i in (s.find('{'), s.find('[')) if i != -1]
    if not starts: return s
    start = min(starts)
    end = max(s.rfind('}'), s.rfind(']'))
    return s[start:(end+1 if end != -1 else None)]

def llm_json(
    user_prompt: str,
    temperature: float = 0.2,
    system_prompt: str | None = None,
    *,
    max_tokens: int = 900,
    timeout_s: int = 90,
    force_json: bool = True
) -> dict:
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TRANSLATION_API_KEY}"
    }
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})

    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    # If your DeepSeek is OpenAI-compatible, this helps keep outputs valid JSON.
    if force_json:
        payload["response_format"] = {"type": "json_object"}

    try:
        resp = _session.post(TRANSLATION_API_URL, headers=headers, json=payload, timeout=(10, timeout_s))
        text = resp.text
        resp.raise_for_status()
    except Exception as e:
        print("[DeepSeek] HTTP error:", repr(e))
        raise RuntimeError(f"DeepSeek HTTP error (network/timeout): {getattr(e, 'args', [''])[0]}")

    # Try normal JSON path (OpenAI-compatible)
    try:
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
    except Exception:
        # Fallback: salvage JSON from raw text
        try:
            content = clean_json_block(text)
            return json.loads(content)
        except Exception:
            print("[DeepSeek] Raw content (first 500):", text[:500])
            print("[DeepSeek] Traceback:\n", traceback.format_exc())
            raise RuntimeError("DeepSeek returned non-parseable JSON")

    content = clean_json_block(content)
    try:
        return json.loads(content)
    except Exception:
        print("[DeepSeek] Content after clean (first 500):", content[:500])
        raise RuntimeError("DeepSeek JSON decode failed")
