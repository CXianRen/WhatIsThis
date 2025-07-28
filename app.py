import os
import json
import sqlite3
from flask import Flask, render_template, jsonify, send_from_directory, request
from duckduckgo_search import DDGS  # 你需要确保已安装 duckduckgo_search
import requests

app = Flask(__name__)

# ==== 文件路径 ====
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, 'data')
IMAGE_DIR = os.path.join(DATA_DIR, 'images')
RESULT_JSON = os.path.join(DATA_DIR, 'result.json')
CACHE_DB = os.path.join(DATA_DIR, 'img_cache.db')

EN_PHONETIC_DB = os.path.join(DATA_DIR, 'en_phonetic.db')


# ==== 内存缓存 ====
img_cache_map = {}
en_phonetic_map = {}

# ==== 初始化数据库 ====
def init_cache_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    with sqlite3.connect(CACHE_DB) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cache (
                query TEXT PRIMARY KEY,
                urls TEXT
            )
        ''')
        conn.commit()
    
    with sqlite3.connect(EN_PHONETIC_DB) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS en_phonetic (
                word TEXT PRIMARY KEY,
                phonetic TEXT
            )
        ''')
        conn.commit()


# ==== 加载数据库中的缓存 ====
def load_cache():
    global img_cache_map
    with sqlite3.connect(CACHE_DB) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT query, urls FROM cache')
        for row in cursor.fetchall():
            query, urls_json = row
            try:
                img_cache_map[query] = json.loads(urls_json)
            except json.JSONDecodeError:
                continue

# ==== 加载英语发音缓存 ====
def load_en_phonetic_cache():
    global en_phonetic_map
    with sqlite3.connect(EN_PHONETIC_DB) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT word, phonetic FROM en_phonetic')
        for row in cursor.fetchall():
            word, phonetic = row
            en_phonetic_map[word] = {'phonetic': phonetic}

# ==== 保存英语发音缓存 ====
def save_en_phonetic_cache(word, phonetic, audio):
    with sqlite3.connect(EN_PHONETIC_DB) as conn:
        cursor = conn.cursor()
        cursor.execute(
            'REPLACE INTO en_phonetic (word, phonetic) VALUES (?, ?)',
            (word, phonetic)
        )
        conn.commit()

# ==== 保存新的缓存项 ====
def save_cache(query, urls):
    with sqlite3.connect(CACHE_DB) as conn:
        cursor = conn.cursor()
        cursor.execute(
            'REPLACE INTO cache (query, urls) VALUES (?, ?)',
            (query, json.dumps(urls))
        )
        conn.commit()

# ==== 搜索图片 ====
def search_images(query, max_results=5):
    with DDGS() as ddgs:
        results = ddgs.images(query)
        images = []
        for r in results:
            images.append(r["image"])
            if len(images) >= max_results:
                break
        return images

# ==== 初始化数据库和缓存 ====
init_cache_db()
load_cache()
load_en_phonetic_cache()

# ==== 加载原始数据 ====
with open(RESULT_JSON, 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

name_id_map = {}
for item in raw_data:
    tid = item['id']
    img = item['file_upload']
    name_id_map[img] = tid - 1
print("Total images loaded:", len(name_id_map))


# ==== 路由 ====
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


@app.route('/data/search_as')
def search_as():
    query = request.args.get('query')
    keyword = request.args.get('keyword')
    urls = search_images(keyword, 5)
    img_cache_map[query] = urls
    save_cache(query, urls)
    return jsonify(urls)


@app.route('/search/<query>')
def search(query):
    if query in img_cache_map:
        urls = img_cache_map[query]
    else:
        urls = search_images(query, 5)
        img_cache_map[query] = urls
        save_cache(query, urls)
    return jsonify(urls)



def get_phonetic(word):
    # 检查缓存
    if word in en_phonetic_map:
        return en_phonetic_map[word]['phonetic']
    
    api_url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
    try:
        response = requests.get(api_url)
        if response.status_code == 200:
            data = response.json()
            # print(data)
            phonetics = data[0].get('phonetics', None)
            # print(data)
            phonetic = None
            for p in phonetics:
                if "text" in p.keys() and p["text"] !="":
                    phonetic= p["text"]
            if phonetic:
                # 保存到数据库
                with sqlite3.connect(EN_PHONETIC_DB) as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        'REPLACE INTO en_phonetic (word, phonetic) VALUES (?, ?)',
                        (word, phonetic)
                    )
                    conn.commit()
                en_phonetic_map[word] = {'phonetic': phonetic}
            return phonetic
        else:
            return 'unknown'
    except Exception as e:
        return str(e)

def get_pronouce(word):
    api_url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
    try:
        response = requests.get(api_url)
        if response.status_code == 200:
            data = response.json()
            # print(data)
            ress = data[0].get('phonetics', None)
            # print(data)
            res = None
            for p in ress:
                if "audio" in p.keys() and p["audio"] !="":
                    res= p["audio"]
            return res
        else:
            return None
    except Exception as e:
        return str(e)


@app.route('/phonetic/<text>', methods=['GET'])
def get_phonetic_of_a_sentence(text):
    words = text.split()
    phonetics = []
    for word in words:
        phonetic = get_phonetic(word)
        phonetics.append(phonetic)
        # print(f"Word: {word}, Phonetic: {phonetic}")
    
    # print(jsonify({'phonetics': phonetics}))
    return jsonify({'phonetics': phonetics})

@app.route('/pronounce/<text>', methods=['GET'])
def get_pronunciation(text):
    words = text.split()
    audios = []
    for word in words:
        audio = get_pronouce(word)
        audios.append(audio)
    return jsonify({'audios': audios})


# ==== 入口 ====
if __name__ == '__main__':
    app.run(debug=True)
