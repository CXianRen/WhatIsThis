# ================= 基础路由模块 =================
from flask import Blueprint, render_template, jsonify, send_from_directory, request
from utils import *
import json
import os
from config import RESULT_JSON, IMAGE_DIR

# 创建蓝图
main_bp = Blueprint('main', __name__)

# 加载数据
with open(RESULT_JSON, 'r', encoding='utf-8') as f:
    raw_data = json.load(f)
name_id_map = {item['file_upload']: item['id'] - 1 for item in raw_data}

# 首页导航
@main_bp.route('/')
def nav():
    return render_template('nav.html')

# app1: 看图识词
@main_bp.route('/app1')
def app1():
    return render_template('LWI.html')

# app2: 分组学习
@main_bp.route('/app2')
def app2():
    return render_template('LWG.html')

# app3: 小说阅读
@main_bp.route('/app3')
def app3():
    return render_template('NovelReader.html')

# app4: 标注模式
@main_bp.route('/app4')
def app4():
    return render_template('Annotation.html')

# 小说上传页面
@main_bp.route('/novel-upload')
def novel_upload():
    return render_template('NovelUpload.html')

# 语言转换页面
@main_bp.route('/novel-translation')
def novel_translation():
    return render_template('NovelTranslation.html')

# 网站清单
@main_bp.route('/site.webmanifest')
def site_webmanifest():
    return send_from_directory('static', 'site.webmanifest')

# Service Worker
@main_bp.route('/sw.js')
def service_worker():
    response = send_from_directory('static', 'sw.js')
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Service-Worker-Allowed'] = '/'
    return response

# 图片文件服务

@main_bp.route('/list')
def list_images():
    return jsonify(list(name_id_map.keys()))

@main_bp.route('/data/<image_name>')
def get_data(image_name):
    return jsonify(raw_data[name_id_map[image_name]])

@main_bp.route('/data/images/<filename>')
def get_image(filename):
    return send_from_directory(IMAGE_DIR, filename)

@main_bp.route('/loadWordDetails/<word>', methods=['GET'])
def load_word_details(word):
    """加载单词详情，包括音标、发音、笔记和图片"""
#   {
#     "word": ["hello", "hellos (rare plural)"],
#     "pronunciation": ["/həˈləʊ/"],
#     "spelling_pronunciation": ["huh-LOH"],
#     "explain_zh": ["打招呼用语，表示问候", "电话用语，表示接听"],
#     "explain_en": ["A common greeting used to acknowledge someone's presence", "Used to answer the phone or attract attention"],
#     "example_sentences": [
#         {
#         "scenario": "见面时向朋友打招呼",
#         "en": "Hello! How are you today?",
#         "zh": "你好！今天过得怎么样？"
#         },
#         {
#         "scenario": "接听电话时的第一句话",
#         "en": "Hello, this is John speaking.",
#         "zh": "你好，我是约翰。"
#         }
#     ],
#     "synonyms": ["hi", "greetings"]
#   }
    res = AI_Dictionary(word)
    res = json.loads(res)
    return jsonify(res)

@main_bp.route('/searchImagesAs/<word>/<key>', methods=['GET'])
def search_images_as_endpoint(word, key):
    """使用自定义关键词强制搜索图片并更新缓存"""
    max_results = request.args.get('max_results', 5, type=int)
    try:
        urls = search_images_as_api(word, key, max_results)
        return jsonify({'success': True, 'images': urls, 'word': word, 'key': key})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@main_bp.route('/components/word_detail_panel')
def get_word_detail_panel():
    """返回词详情栏组件的HTML"""
    return render_template('word_detail_panel.html')
