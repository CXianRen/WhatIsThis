# ================= 工具函数模块 =================
import requests
from duckduckgo_search import DDGS
from models.database import *
from config.config import TRANSLATION_API_KEY, TRANSLATION_API_URL
import json

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

def clean_json_block(content):
    # 去掉 markdown 的 ```json 和 ``` 包裹
    if content.startswith("```json"):
        content = content.strip()[7:]  # 去掉开头 ```json（长度7）
    content = content.strip("` \n")   # 去掉结尾的 ``` 和空白
    return content

def AI_Dictionary(words):
    """使用DeepSeek API获取单词详细信息"""
    # try to get from cache first
    cached_result = get_en_dict_cache(words)
    if cached_result:
        print("命中缓存，直接返回结果: ", words)
        return cached_result['definition']

    else:
        print("未命中缓存，调用DeepSeek API获取数据")

        # DeepSeek API配置
        api_url = TRANSLATION_API_URL
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TRANSLATION_API_KEY}"
        }
        
        prompt = f"""请提供单词/词组 "{words}" 的详细信息，严格按照以下JSON格式返回：
    {{
    "word": ["原词/词组", "其他常见变体（如复数、分词等）"],
    "pronunciation": ["IPA 音标"],
    "spelling_pronunciation": ["逐词拼读（适合学习者）"],
    "explain_zh": ["中文解释 1", "中文解释 2（如有不同含义）"],
    "explain_en": ["English definition 1", "English definition 2 (if multiple meanings)"],
    "example_sentences": [
        {{
        "scenario": "使用场景描述（什么环境下，想表达什么的时候）",
        "en": "Example sentence in English",
        "zh": "对应的中文翻译"
        }}
    ],
    "synonyms": ["近义词 1", "近义词 2"]
    }}

    请确保返回的是有效的JSON格式。"""

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
                print("API返回内容:", content)
                
                # save to cache
                set_en_dict_cache(words, content)

                # 尝试解析JSON
                
                return content
            else:
                return {"error": f"API请求失败: {response.status_code}"}
        except Exception as e:
            return {"error": f"请求异常: {str(e)}"}