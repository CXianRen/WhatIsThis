# ================= Utility Functions Module =================
import requests
from duckduckgo_search import DDGS
from models.database import *
from config.config import TRANSLATION_API_KEY, TRANSLATION_API_URL
import json


def search_images(query, max_results=5):
    """Search images"""
    with DDGS() as ddgs:
        results = ddgs.images(query)
        images = []
        for r in results:
            images.append(r["image"])
            if len(images) >= max_results:
                break
        return images


def search_images_api(query, max_results=5):
    """Search images API (with cache)"""
    cached_urls = get_img_cache(query)
    if cached_urls:
        return cached_urls

    urls = search_images(query, max_results)
    set_img_cache(query, urls)
    return urls


def search_images_as_api(query, key, max_results=5):
    """Force search images with a specific keyword and update cache"""
    urls = search_images(key, max_results)
    set_img_cache(query, urls)
    return urls


def get_phonetic(word):
    """Get word phonetic"""
    cached_phonetic = get_phonetic_cache(word)
    if cached_phonetic:
        return cached_phonetic['phonetic']

    api_url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
    try:
        resp = requests.get(api_url)
        if resp.status_code == 200:
            data = resp.json()
            phonetics = data[0].get('phonetics', [])
            phonetic = next((p["text"]
                            for p in phonetics if p.get("text")), None)
            if phonetic:
                set_phonetic_cache(word, phonetic)
            return phonetic or 'unknown'
        return None
    except Exception as e:
        return str(e)


def get_pronounce(word):
    """Get word pronunciation URL"""
    api_url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
    try:
        resp = requests.get(api_url)
        if resp.status_code == 200:
            data = resp.json()
            ress = data[0].get('phonetics', [])
            audio = next((p["audio"] for p in ress if p.get("audio")), None)
            return audio
        return None
    except Exception as e:
        return str(e)


def clean_json_block(content):
    # Remove markdown ```json and ``` wrappers
    if content.startswith("```json"):
        content = content.strip()[7:]  # Remove leading ```json (length 7)
    content = content.strip("` \n")   # Remove trailing ``` and whitespace
    return content


def AI_Dictionary(words, target_lang="en", native_lang="zh"):
    """
    DeepSeek for getting word details
    """
    # try to get from cache first
    cached_result = get_en_dict_cache(words)
    if cached_result:
        print("Cache hit, returning result directly: ", words)
        return cached_result['definition']

    else:
        print("Cache miss, calling DeepSeek API to fetch data")

        # DeepSeek API配置
        api_url = TRANSLATION_API_URL
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TRANSLATION_API_KEY}"
        }

        # Allow setting target language and native language
        prompt = f"""Please provide detailed information for the {target_lang} word/phrase "{words}" in strict JSON format as below:
    {{
      "word": ["original word/phrase", "other common forms (e.g., plural, participle, etc.)"],
      "pronunciation": ["IPA phonetic transcription"],
      "spelling_pronunciation": ["spelling out for learners"],
      "explain_{native_lang}": ["Definition in {native_lang} 1", "Definition in {native_lang} 2, ...(if multiple meanings)"],
      "explain_{target_lang}": ["Definition in {target_lang} 1", "Definition in {target_lang} 2, ...(if multiple meanings)"],
      "example_sentences": [
        {{
          "scenario": "Description of usage scenario (e.g. when, what, how, why, you want to express/describe/explain)",
          "{target_lang}": "Example sentence in {target_lang}",
          "{native_lang}": "Corresponding translation in {native_lang}"
        }}
      ],
      "synonyms": ["synonym 1", "synonym 2"]
    }}

    Please make sure the response is valid JSON and not including other text."""

        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.1
        }

        # print("prompt:", prompt)
        try:
            response = requests.post(api_url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                content = data['choices'][0]['message']['content']
                content = clean_json_block(content)
                print("API return:", content)

                # save to cache
                set_en_dict_cache(words, content)

                # 尝试解析JSON

                return content
            else:
                return {"error": f"API request fail: {response.status_code}"}
        except Exception as e:
            return {"error": f"请求异常: {str(e)}"}
