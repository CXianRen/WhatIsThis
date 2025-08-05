# ================= 数据库管理模块 =================
import os
import json
import sqlite3
from config import IMG_CACHE_DB, EN_PHONETIC_DB, DATA_DIR

# 内存缓存
img_cache_map = {}
en_phonetic_map = {}

def init_db():
    """初始化数据库"""
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # 初始化图片缓存数据库
    with sqlite3.connect(IMG_CACHE_DB) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS cache (query TEXT PRIMARY KEY, urls TEXT)''')
    
    # 初始化音标数据库
    with sqlite3.connect(EN_PHONETIC_DB) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS en_phonetic (word TEXT PRIMARY KEY, phonetic TEXT)''')

def load_img_cache():
    """加载图片缓存到内存"""
    global img_cache_map
    with sqlite3.connect(IMG_CACHE_DB) as conn:
        for query, urls_json in conn.execute('SELECT query, urls FROM cache'):
            try:
                img_cache_map[query] = json.loads(urls_json)
            except Exception:
                continue

def load_phonetic_cache():
    """加载音标缓存到内存"""
    global en_phonetic_map
    with sqlite3.connect(EN_PHONETIC_DB) as conn:
        for word, phonetic in conn.execute('SELECT word, phonetic FROM en_phonetic'):
            en_phonetic_map[word] = {'phonetic': phonetic}

def save_img_cache(query, urls):
    """保存图片缓存到数据库"""
    with sqlite3.connect(IMG_CACHE_DB) as conn:
        conn.execute('REPLACE INTO cache (query, urls) VALUES (?, ?)', (query, json.dumps(urls)))

def save_phonetic_cache(word, phonetic):
    """保存音标缓存到数据库"""
    with sqlite3.connect(EN_PHONETIC_DB) as conn:
        conn.execute('REPLACE INTO en_phonetic (word, phonetic) VALUES (?, ?)', (word, phonetic))

def get_img_cache(query):
    """获取图片缓存"""
    return img_cache_map.get(query)

def set_img_cache(query, urls):
    """设置图片缓存"""
    img_cache_map[query] = urls
    save_img_cache(query, urls)

def get_phonetic_cache(word):
    """获取音标缓存"""
    return en_phonetic_map.get(word)

def set_phonetic_cache(word, phonetic):
    """设置音标缓存"""
    en_phonetic_map[word] = {'phonetic': phonetic}
    save_phonetic_cache(word, phonetic)
