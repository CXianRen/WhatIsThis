import os
import json
import sqlite3
from flask import Flask, render_template, jsonify, send_from_directory, request
from duckduckgo_search import DDGS  # 你需要确保已安装 duckduckgo_search

app = Flask(__name__)

# ==== 文件路径 ====
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, 'data')
IMAGE_DIR = os.path.join(DATA_DIR, 'images')
RESULT_JSON = os.path.join(DATA_DIR, 'result.json')
CACHE_DB = os.path.join(DATA_DIR, 'img_cache.db')

# ==== 内存缓存 ====
img_cache_map = {}

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


# ==== 入口 ====
if __name__ == '__main__':
    app.run(debug=True)
