# ================= Translation Service Module (Simplified) =================
import re
import time
import json
import requests
import threading
from config.config import (
    TRANSLATION_API_KEY,
    TRANSLATION_API_URL,
    SUPPORTED_LANGUAGES,
    NOVEL_DIR)

import os
import json

# Simplified translation management
translation_results = {}  # Store translation results and progress
current_task = None  # Currently processing task
processing_lock = threading.Lock()  # Ensure only one task is running


def split_sentences(text: str) -> list:
    """Split text into a list of sentences by punctuation"""
    sentences = re.split(r'[。！？.]', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    return sentences


def to_content(setences: list) -> list:
    content = []
    for idx, sentence in enumerate(setences):
        content.append({
            "idx": idx + 1,
            "sentence": sentence
        })
    return content


def translate_content(raw_content, src_lang, dst_lang, dst_level) -> list:
    """Translate raw content to target language"""
    sentences = split_sentences(raw_content)
    translated_sentences = []

    # Process in batches of 10 sentences
    batch_size = 10
    for i in range(0, len(sentences), batch_size):
        batch = sentences[i:i + batch_size]
        translated_batch = translate_sentences_batch(
            batch, src_lang, dst_lang, dst_level)
        translated_sentences.extend(translated_batch)

    return to_content(translated_sentences)


def translate_sentences_batch(sentences: list, source_language: str, target_language: str, target_level: str, retry_times=3) -> list:
    language_map = {
        'en': 'English',
        'zh': 'Chinese',
        'fr': 'French',
        'se': 'Swedish',
    }

    headers = {
        "Authorization": f"Bearer {TRANSLATION_API_KEY}",
        "Content-Type": "application/json"
    }

    prompt = f"""
Translate the following sentences to {language_map[target_language]} at {target_level} level. Return the same JSON structure.
Requirement:
1. key the output same structure of input (list).
Input:
{json.dumps(sentences, ensure_ascii=False)}
"""
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a professional translation assistant. Return valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 2000,
        "temperature": 0.1,
        "stream": False
    }

    for attempt in range(retry_times):
        try:
            resp = requests.post(TRANSLATION_API_URL,
                                 headers=headers, json=data, timeout=60)
            resp.raise_for_status()
            result = resp.json()

            translated_content = result['choices'][0]['message']['content'].strip(
            )

            translated_content = translated_content.lstrip(
                '```json').rstrip('```').strip()

            translated_json = json.loads(translated_content)
            print("get translation:", translated_json)
            return translated_json     
        except Exception:
            if attempt < retry_times - 1:
                # time.sleep(3)
                continue
            else:
                return [f"[Translation failed] {s}" for s in sentences]

    return [f"[Translation failed] {s}" for s in sentences]
