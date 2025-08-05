# ================= 基础路由模块 =================
from flask import Blueprint, render_template, jsonify, send_from_directory, request
from utils import search_images_api, search_images_as_api, get_phonetic, get_pronounce
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
    res = {
        'word': word,
        'phonetic': get_phonetic(word),
        'audio': get_pronounce(word),
        'notes': [],
        'images': search_images_api(word, 5)
    }
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
