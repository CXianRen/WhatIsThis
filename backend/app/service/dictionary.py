# ================= Utility Functions Module =================
import requests
from duckduckgo_search import DDGS
from models.database import *
from config.config import TRANSLATION_API_KEY, TRANSLATION_API_URL
import json


def search_images(word, max_results=5):
    """Search images"""
    with DDGS() as ddgs:
        results = ddgs.images(word)
        images = []
        for r in results:
            images.append(r["image"])
            if len(images) >= max_results:
                break
        return images


def search_images_api(lang, word, max_results=5):
    """Search images API (with cache)"""
    cached_urls = get_word_imgs(lang, word)
    if cached_urls:
        return cached_urls

    urls = search_images(word, max_results)
    save_word_imgs(lang, word, urls)
    return urls


def search_images_as_api(lang, word, key, max_results=5):
    """Force search images with a specific keyword and update cache"""
    urls = search_images(key, max_results)
    save_word_imgs(lang, word, urls)
    return urls

# abandoned function


def get_phonetic(lang, word):
    """Get word phonetic"""
    return None

# abandoned function


def get_pronounce(word):
    """Get word pronunciation"""
    # This function is not implemented, returning None
    return None


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
    cached_result = get_word_definition(target_lang, words)
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
                save_word_definition(target_lang, words, content)

                return content
            else:
                return {"error": f"API request fail: {response.status_code}"}
        except Exception as e:
            return {"error": f"request error: {str(e)}"}
