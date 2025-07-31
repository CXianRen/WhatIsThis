
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


GROUP_DIR = os.path.join(DATA_DIR, 'group')
os.makedirs(GROUP_DIR, exist_ok=True)

app = Flask(__name__)


# ================= 内存缓存 =================
img_cache_map = {}
en_phonetic_map = {}
dag_map = {}  # {dag_name: dag_dict}

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
        return None
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


# ================= DAG加载与保存 =================
def load_all_dags():
    dag_map.clear()
    if not os.path.exists(GROUP_DIR):
        os.makedirs(GROUP_DIR, exist_ok=True)
    for fname in os.listdir(GROUP_DIR):
        if fname.endswith('.json'):
            fpath = os.path.join(GROUP_DIR, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    dag = json.load(f)
                    dag_map[dag.get('name', fname[:-5])] = dag
            except Exception as e:
                print(f"Failed to load DAG {fname}: {e}")

def save_dag(dag):
    name = dag.get('name')
    if not name:
        raise ValueError('DAG必须有name字段')
    fpath = os.path.join(GROUP_DIR, f'{name}.json')
    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(dag, f, ensure_ascii=False, indent=2)
    dag_map[name] = dag

def delete_dag(name):
    fpath = os.path.join(GROUP_DIR, f'{name}.json')
    if os.path.exists(fpath):
        os.remove(fpath)
    dag_map.pop(name, None)

# ================= 初始化 =================
init_db()
load_img_cache()
load_phonetic_cache()
load_all_dags()

with open(RESULT_JSON, 'r', encoding='utf-8') as f:
    raw_data = json.load(f)
name_id_map = {item['file_upload']: item['id'] - 1 for item in raw_data}
print(f"Total images loaded: {len(name_id_map)}")

# ================= 路由 =================

# 首页导航
@app.route('/')
def nav():
    return render_template('nav.html')

# app1: 看图识词
@app.route('/app1')
def app1():
    return render_template('LWI.html')

# app2: 分组学习
@app.route('/app2')
def app2():
    return render_template('LWG.html')

@app.route('/list')
def list_images():
    return jsonify(list(name_id_map.keys()))

@app.route('/data/<image_name>')
def get_data(image_name):
    return jsonify(raw_data[name_id_map[image_name]])

@app.route('/data/images/<filename>')
def get_image(filename):
    return send_from_directory(IMAGE_DIR, filename)

def search_images_api(query, max_results=5):
    """搜索图片API"""
    if query in img_cache_map:
        urls = img_cache_map[query]
    else:
        urls = search_images(query, max_results)
        img_cache_map[query] = urls
        save_img_cache(query, urls)
    return urls

def search_images_as_api(query, key, max_results=5):
    """
        force search images with a specific key
        and update the cache with the new results
    """
    urls = search_images(key, max_results)
    img_cache_map[query] = urls
    save_img_cache(query, urls)
    return urls


# new api, loadWordDetails(word)
# return details of the word
# json format:
# {
#   "word": "example",
#   "phonetic": "ɪɡˈzæmpəl",
#   "audio": "https://example.com/audio.mp3",
#   "notes": [],
#   "images": []
# }

@app.route('/loadWordDetails/<word>', methods=['GET'])
def load_word_details(word):
    """加载单词详情，包括音标、发音、笔记和图片"""
    res = {}
    res['word'] = word
    res['phonetic'] = get_phonetic(word)
    res['audio'] = get_pronounce(word)
    res['notes'] = []  # 假设没有笔记
    res['images'] = search_images_api(word, 5)  # 搜索相关图片
    return jsonify(res)

@app.route('/searchImagesAs/<word>/<key>', methods=['GET'])
def search_images_as_endpoint(word, key):
    """使用自定义关键词强制搜索图片并更新缓存"""
    max_results = request.args.get('max_results', 5, type=int)
    try:
        urls = search_images_as_api(word, key, max_results)
        return jsonify({'success': True, 'images': urls, 'word': word, 'key': key})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500



# ================= LWG相关API =================
@app.route('/group', methods=['GET'])
def get_dag_list():
    """获取所有DAG列表"""
    return jsonify(list(dag_map.values()))

# 新增DAG
@app.route('/group/add', methods=['POST'])
def add_dag():
    dag = request.get_json()
    name = dag.get('name')
    if not name:
        return jsonify({'success': False, 'error': 'DAG必须有name字段'}), 400
    if name in dag_map:
        return jsonify({'success': False, 'error': 'DAG已存在'}), 400
    try:
        save_dag(dag)
        return jsonify({'success': True, 'dag': dag})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# 更新DAG
@app.route('/group/update/<dag_name>', methods=['POST'])
def update_dag(dag_name):
    dag = request.get_json()
    if not dag.get('name'):
        return jsonify({'success': False, 'error': 'DAG必须有name字段'}), 400
    if dag_name != dag['name']:
        # 支持重命名，先删旧的
        delete_dag(dag_name)
    try:
        save_dag(dag)
        return jsonify({'success': True, 'dag': dag})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# 删除DAG
@app.route('/group/delete/<dag_name>', methods=['POST'])
def delete_dag_api(dag_name):
    if dag_name not in dag_map:
        return jsonify({'success': False, 'error': 'DAG不存在'}), 404
    try:
        delete_dag(dag_name)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/components/word_detail_panel')
def get_word_detail_panel():
    """返回词详情栏组件的HTML"""
    return render_template('word_detail_panel.html')

# ================= 入口 =================
if __name__ == '__main__':
    app.run(debug=True)
