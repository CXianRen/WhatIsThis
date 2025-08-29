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
    # remove all \t and \n
    sentences = [s.replace('\n', ' ').replace('\t', ' ') for s in sentences]
    # remove multiple spaces
    sentences = [re.sub(r'\s+', ' ', s) for s in sentences]
    # remove empty sentences
    sentences = [s for s in sentences if s]
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
You are a translation engine.

Task:
Translate the following text block into {language_map[target_language]} at {target_level} level.

Strict Requirements:
1. Keep the same JSON list structure as the input.
2. Each input block corresponds to ONE output. 
   - Do NOT split one block into multiple blocks.
   - Do NOT merge multiple blocks into one.
3. Do NOT drop or add any content.
4. Do NOT change the order.
5. Output valid JSON only.
6. output format:
{{
"translations": [
    "translated  block 1",
    "translated  block 2",
    ...
}}
Input:
{json.dumps(sentences, ensure_ascii=False)}
"""
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a professional translation assistant."},
            {"role": "user", "content": prompt}
        ],
        
        "max_tokens": 5000,
        "temperature": 0.1,
        "stream": False,
        "response_format": {"type": "json_object"}
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
                print("Translated content:", translated_content)
                res = json.loads(translated_content)['translations']
                print("In put len:", len(sentences), "Out put len:", len(res))
                return res 
            except Exception as e:
                if attempt < retry_times - 1:
                    print(f"Translation attempt {attempt + 1} failed: {e}. Retrying...")
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
