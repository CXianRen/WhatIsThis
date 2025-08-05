# ================= 小说阅读路由模块 =================
from flask import Blueprint, jsonify
import os
import json
from config import NOVEL_DIR

# 创建蓝图
novel_bp = Blueprint('novel', __name__, url_prefix='/novel')

@novel_bp.route('/list')
def get_novel_list():
    """获取所有小说和章节列表"""
    novels = []
    
    if not os.path.exists(NOVEL_DIR):
        return jsonify(novels)
    
    for novel_name in os.listdir(NOVEL_DIR):
        novel_path = os.path.join(NOVEL_DIR, novel_name)
        if os.path.isdir(novel_path):
            chapters = []
            
            # 扫描txt文件和传统的章节目录
            # 首先检查txt文件
            txt_files = sorted([f for f in os.listdir(novel_path) if f.endswith('.txt')])
            for txt_file in txt_files:
                chapters.append({
                    'name': txt_file[:-4],  # 去掉.txt扩展名
                    'path': f'{novel_name}/{txt_file}',
                    'type': 'txt'
                })
            
            # 然后检查传统的章节目录（兼容旧格式）
            for item_name in sorted(os.listdir(novel_path)):
                item_path = os.path.join(novel_path, item_name)
                if os.path.isdir(item_path):
                    # 检查是否有en.json文件
                    en_json_path = os.path.join(item_path, 'en.json')
                    if os.path.exists(en_json_path):
                        chapters.append({
                            'name': item_name,
                            'path': f'{novel_name}/{item_name}',
                            'type': 'json'
                        })
            
            if chapters:  # 只有当有章节时才添加小说
                novels.append({
                    'name': novel_name,
                    'chapters': chapters
                })
    
    return jsonify(novels)

@novel_bp.route('/chapter/<novel_name>/<chapter_name>')
def get_chapter_content(novel_name, chapter_name):
    """获取指定章节的内容"""
    try:
        # 先尝试txt文件格式
        if chapter_name.endswith('.txt'):
            txt_path = os.path.join(NOVEL_DIR, novel_name, chapter_name)
            if os.path.exists(txt_path):
                with open(txt_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 解析txt内容，转换为适合阅读器的格式
                lines = content.strip().split('\n')
                title = lines[0].strip() if lines else chapter_name[:-4]
                text_content = '\n'.join(lines[1:]).strip() if len(lines) > 1 else content
                
                # 将内容按段落分割
                paragraphs = [p.strip() for p in text_content.split('\n') if p.strip()]
                
                # 转换为阅读器期望的格式
                sentences = []
                for para in paragraphs:
                    sentences.extend([{
                        'text': sentence.strip() + '。',
                        'translation': ''  # txt格式暂时没有翻译
                    } for sentence in para.split('。') if sentence.strip()])
                
                return jsonify({
                    'title': title,
                    'sentences': sentences
                })
        
        # 兼容旧的json格式
        chapter_path = os.path.join(NOVEL_DIR, novel_name, chapter_name)
        en_json_path = os.path.join(chapter_path, 'en.json')
        
        if not os.path.exists(en_json_path):
            return jsonify({'error': '章节文件不存在'}), 404
        
        with open(en_json_path, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        return jsonify(content)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
