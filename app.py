
# ================= 配置与全局变量 =================
import os
import json
import sqlite3
import requests
from flask import Flask, render_template, jsonify, send_from_directory, request
from duckduckgo_search import DDGS

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, 'data')
IMAGE_DIR = os.path.join(DATA_DIR, 'images')
RESULT_JSON = os.path.join(DATA_DIR, 'result.json')
IMG_CACHE_DB = os.path.join(DATA_DIR, 'img_cache.db')
EN_PHONETIC_DB = os.path.join(DATA_DIR, 'en_phonetic.db')

app = Flask(__name__)

# ================= 内存缓存 =================
img_cache_map = {}
en_phonetic_map = {}

# ================= 数据库相关 =================
def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    with sqlite3.connect(IMG_CACHE_DB) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS cache (query TEXT PRIMARY KEY, urls TEXT)''')
    with sqlite3.connect(EN_PHONETIC_DB) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS en_phonetic (word TEXT PRIMARY KEY, phonetic TEXT)''')

def load_img_cache():
    global img_cache_map
    with sqlite3.connect(IMG_CACHE_DB) as conn:
        for query, urls_json in conn.execute('SELECT query, urls FROM cache'):
            try:
                img_cache_map[query] = json.loads(urls_json)
            except Exception:
                continue

def load_phonetic_cache():
    global en_phonetic_map
    with sqlite3.connect(EN_PHONETIC_DB) as conn:
        for word, phonetic in conn.execute('SELECT word, phonetic FROM en_phonetic'):
            en_phonetic_map[word] = {'phonetic': phonetic}

def save_img_cache(query, urls):
    with sqlite3.connect(IMG_CACHE_DB) as conn:
        conn.execute('REPLACE INTO cache (query, urls) VALUES (?, ?)', (query, json.dumps(urls)))

def save_phonetic_cache(word, phonetic):
    with sqlite3.connect(EN_PHONETIC_DB) as conn:
        conn.execute('REPLACE INTO en_phonetic (word, phonetic) VALUES (?, ?)', (word, phonetic))

# ================= 工具函数 =================
def search_images(query, max_results=5):
    with DDGS() as ddgs:
        results = ddgs.images(query)
        images = []
        for r in results:
            images.append(r["image"])
            if len(images) >= max_results:
                break
        return images

def get_phonetic(word):
    if word in en_phonetic_map:
        return en_phonetic_map[word]['phonetic']
    api_url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
    try:
        resp = requests.get(api_url)
        if resp.status_code == 200:
            data = resp.json()
            phonetics = data[0].get('phonetics', [])
            phonetic = next((p["text"] for p in phonetics if p.get("text")), None)
            if phonetic:
                save_phonetic_cache(word, phonetic)
                en_phonetic_map[word] = {'phonetic': phonetic}
            return phonetic or 'unknown'
        return 'unknown'
    except Exception as e:
        return str(e)

def get_pronounce(word):
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

# ================= 初始化 =================
init_db()
load_img_cache()
load_phonetic_cache()

with open(RESULT_JSON, 'r', encoding='utf-8') as f:
    raw_data = json.load(f)
name_id_map = {item['file_upload']: item['id'] - 1 for item in raw_data}
print(f"Total images loaded: {len(name_id_map)}")

# ================= 路由 =================
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/list')
def list_images():
    return jsonify(list(name_id_map.keys()))

@app.route('/data/<image_name>')
def get_data(image_name):
    return jsonify(raw_data[name_id_map[image_name]])

@app.route('/data/images/<filename>')
def get_image(filename):
    return send_from_directory(IMAGE_DIR, filename)

@app.route('/search/<query>')
def search(query):
    if query in img_cache_map:
        urls = img_cache_map[query]
    else:
        urls = search_images(query, 5)
        img_cache_map[query] = urls
        save_img_cache(query, urls)
    return jsonify(urls)

# this is for searching by user, if the user wants to search images by a keyword
# this is useful when the user wants to search images related to a specific topic
@app.route('/search_as')
def search_as():
    query = request.args.get('query')
    keyword = request.args.get('keyword')
    if not query or not keyword:
        return jsonify({'error': 'Missing query or keyword parameter'}), 400

    # force update the cache
    urls = search_images(keyword, 5)
    img_cache_map[query] = urls
    save_img_cache(query, urls)
    return jsonify(urls)


@app.route('/phonetic/<text>', methods=['GET'])
def get_phonetic_of_sentence(text):
    words = text.split()
    phonetics = [get_phonetic(word) for word in words]
    return jsonify({'phonetics': phonetics})

@app.route('/pronounce/<text>', methods=['GET'])
def get_pronunciation(text):
    words = text.split()
    audios = [get_pronounce(word) for word in words]
    return jsonify({'audios': audios})

# ================= 入口 =================
if __name__ == '__main__':
    app.run(debug=True)
