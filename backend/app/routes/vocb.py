# vocb 模块， 管理 单词相关 API 路由
from flask import Blueprint, request, jsonify, render_template
import os
import json 
import re

from service.dictionary import *

vocb_bp = Blueprint('vocb', __name__, url_prefix='/api/vocb')


all_tags = ["mispronounciation","misunderstanding"]

### vocabulary api ###

#### TAGS of a word ####

# 获取用户单词tag列表
@vocb_bp.route('/tags', methods=['GET'])
def get_tags():
    # demo tags
    return jsonify({
        "tags": all_tags
    })
    
# 新增tag
@vocb_bp.route('/tags', methods=['POST'])
def add_tag():
    data = request.get_json()
    tags = data.get('tags')
    print(f"Received tags: {tags}")
    
    if not tags:
        return jsonify({"error": "Tag is required"}), 400
    
    # update to global tags list
    global all_tags
    for tag in tags:
        if tag not in all_tags:
            all_tags.append(tag)    
    
    return jsonify({"message": "Tag added successfully", "tag": all_tags}), 201

# 删除tag
@vocb_bp.route('/tags/<tag>', methods=['DELETE'])
def delete_tag(tag):
    # 在这里可以添加逻辑来删除tag
    # 例如，从数据库或文件中删除
    
    return jsonify({"message": "Tag deleted successfully", "tag": tag}), 200
  
# 获取单词得tag
@vocb_bp.route('/word/tags/<word>', methods=['GET'])
def get_word_tags(word):
    # demo tags for the word
    tags = ["mispronounciation", "misunderstanding"]
    
    return jsonify({
        "word": word,
        "tags": tags
    })

# 添加单词tag
@vocb_bp.route('/word/tags/<word>', methods=['POST'])
def add_word_tag(word):
    data = request.get_json()
    tag = data.get('tag')
    
    if not tag:
        return jsonify({"error": "Tag is required"}), 400
    
    # 在这里可以添加逻辑来保存tag
    # 例如，保存到数据库或文件中
    
    return jsonify({"message": "Tag added successfully", "word": word, "tag": tag}), 201

# 删除单词tag
@vocb_bp.route('/word/tags/<word>/<tag>', methods=['DELETE'])
def delete_word_tag(word, tag):
    # 在这里可以添加逻辑来删除tag
    # 例如，从数据库或文件中删除
    
    return jsonify({"message": "Tag deleted successfully", "word": word, "tag": tag}), 200

#### DICTIONARY of a word ####
# get the word details from AI
@vocb_bp.route('/word/<word>', methods=['GET'])
def load_word_details(word):
    """加载单词详情，包括音标、发音、笔记和图片
    {
        "word": ["hello", "hellos (rare plural)"],
        "pronunciation": ["/həˈləʊ/"],
        "spelling_pronunciation": ["huh-LOH"],
        "explain_zh": ["打招呼用语，表示问候", "电话用语，表示接听"],
        "explain_en": ["A common greeting used to acknowledge someone's presence", "Used to answer the phone or attract attention"],
        "example_sentences": [
            {
            "scenario": "见面时向朋友打招呼",
            "en": "Hello! How are you today?",
            "zh": "你好！今天过得怎么样？"
            },
            {
            "scenario": "接听电话时的第一句话",
            "en": "Hello, this is John speaking.",
            "zh": "你好，我是约翰。"
            }
        ],
        "synonyms": ["hi", "greetings"]
    }
    """
    res = AI_Dictionary(word)
    res = json.loads(res)
    return jsonify(res)

# search images of a word
@vocb_bp.route('/word/imgs/<word>/<key>', methods=['GET'])
def search_images_as_endpoint(word, key):
    """使用自定义关键词强制搜索图片并更新缓存"""
    max_results = request.args.get('max_results', 5, type=int)
    try:
        urls = search_images_as_api(word, key, max_results)
        return jsonify({'success': True, 'images': urls, 'word': word, 'key': key})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
