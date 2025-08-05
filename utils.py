# ================= 工具函数模块 =================
import requests
from duckduckgo_search import DDGS
from database import get_img_cache, set_img_cache, get_phonetic_cache, set_phonetic_cache

def search_images(query, max_results=5):
    """搜索图片"""
    with DDGS() as ddgs:
        results = ddgs.images(query)
        images = []
        for r in results:
            images.append(r["image"])
            if len(images) >= max_results:
                break
        return images

def search_images_api(query, max_results=5):
    """搜索图片API（带缓存）"""
    cached_urls = get_img_cache(query)
    if cached_urls:
        return cached_urls
    
    urls = search_images(query, max_results)
    set_img_cache(query, urls)
    return urls

def search_images_as_api(query, key, max_results=5):
    """强制使用特定关键词搜索图片并更新缓存"""
    urls = search_images(key, max_results)
    set_img_cache(query, urls)
    return urls

def get_phonetic(word):
    """获取单词音标"""
    cached_phonetic = get_phonetic_cache(word)
    if cached_phonetic:
        return cached_phonetic['phonetic']
    
    api_url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
    try:
        resp = requests.get(api_url)
        if resp.status_code == 200:
            data = resp.json()
            phonetics = data[0].get('phonetics', [])
            phonetic = next((p["text"] for p in phonetics if p.get("text")), None)
            if phonetic:
                set_phonetic_cache(word, phonetic)
            return phonetic or 'unknown'
        return None
    except Exception as e:
        return str(e)

def get_pronounce(word):
    """获取单词发音URL"""
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
