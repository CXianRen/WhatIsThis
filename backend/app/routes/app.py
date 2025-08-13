# ================= 基础路由模块 =================
from flask import Blueprint, render_template, jsonify, send_from_directory, request
from service.dictionary import *
import json
import os
from config.config import RESULT_JSON, IMAGE_DIR

# 创建蓝图
app_bp = Blueprint('app', __name__)

# 加载数据
with open(RESULT_JSON, 'r', encoding='utf-8') as f:
    raw_data = json.load(f)
name_id_map = {item['file_upload']: item['id'] - 1 for item in raw_data}

# 首页导航
@app_bp.route('/')
def nav():
    return render_template('nav.html')

# app1: 看图识词
@app_bp.route('/app1')
def app_learn_with_images():
    return render_template('LWI.html')

# app2: 分组学习
@app_bp.route('/app2')
def app_learn_in_group():
    return render_template('LWG.html')

# app3: 小说阅读
@app_bp.route('/app3')
def app_novel_reader():
    return render_template('NovelReader.html')

# app4: 标注模式
@app_bp.route('/app4')
def app_annotation():
    return render_template('Annotation.html')

# 小说上传页面
@app_bp.route('/novel-upload')
def app_novel_upload():
    return render_template('NovelUpload.html')

# 语言转换页面
@app_bp.route('/novel-translation')
def app_novel_translation():
    return render_template('NovelTranslation.html')

# 网站清单
@app_bp.route('/site.webmanifest')
def site_webmanifest():
    return send_from_directory('static', 'site.webmanifest')

# Service Worker
@app_bp.route('/sw.js')
def service_worker():
    response = send_from_directory('static', 'sw.js')
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Service-Worker-Allowed'] = '/'
    return response


@app_bp.route('/components/word_detail_panel')
def get_word_detail_panel():
    """返回词详情栏组件的HTML"""
    return render_template('word_detail_panel.html')

@app_bp.route('/components/<component_name>')
def get_component(component_name):
    """返回指定组件的HTML"""
    component_path = os.path.join('components', component_name)
    if os.path.exists(component_path):
        return render_template(component_path)
    else:
        return jsonify({"error": "Component not found"}), 404