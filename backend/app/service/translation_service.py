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

from concurrent.futures import ThreadPoolExecutor, as_completed

# Simplified translation management
translation_results = {}  # Store translation results and progress
current_task = None  # Currently processing task
processing_lock = threading.Lock()  # Ensure only one task is running


def split_sentences(text: str) -> list:
    """Split text into a list of sentences by punctuation"""
    sentences = re.split(r'[。.]', text)
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

    translated_sentences = translate_in_parallel(
        sentences, src_lang, dst_lang, dst_level, batch_size=5, max_workers=10
    )

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
2. Don't change the order of sentences.
3. Don't miss any sentence.
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

    def _request():
        for attempt in range(retry_times):
            try:
                resp = requests.post(
                    TRANSLATION_API_URL,
                    headers=headers,
                    json=data,
                    timeout=60
                )
                resp.raise_for_status()
                result = resp.json()
                translated_content = result['choices'][0]['message']['content'].strip()
                translated_content = translated_content.lstrip('```json').rstrip('```').strip()
                return json.loads(translated_content)
            except Exception as e:
                if attempt < retry_times - 1:
                    continue
                return [f"[Translation failed] {s}" for s in sentences]

    return _request()


def translate_in_parallel(all_sentences: list, source_language: str, target_language: str, target_level: str, batch_size=5, max_workers=10):
    batches = [all_sentences[i:i+batch_size] for i in range(0, len(all_sentences), batch_size)]
    
    results = [None] * len(batches)

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_idx = {
            executor.submit(
                translate_sentences_batch, batch, source_language, target_language, target_level
            ): idx
            for idx, batch in enumerate(batches)
        }

        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                results[idx] = future.result()
            except Exception as e:
                results[idx] = [f"[Batch failed] {b}" for b in batches[idx]]

    # 拼接所有批次结果
    return [item for batch in results for item in batch]
