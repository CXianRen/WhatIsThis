# ================= 小说管理和阅读路由模块 =================
from flask import Blueprint, jsonify, request
import os
import json
import re
from config import NOVEL_DIR

# ================= 重构后的小说API =================
novel_bp = Blueprint('novel', __name__, url_prefix='/novel')


def __parse_novel_raw_name(name: str):
    base_name = name.replace(".txt", "")
    parts = base_name.split('_')
    res = {}
    res['cid'] = int(parts[0])
    res['title'] = parts[1]
    res['basename'] = base_name
    return res

def __gen_novel_raw_name(cid: int, title: str):
    safe_title = f"{cid:03d}_{title}.txt"
    return safe_title


# 获取所有小说
@novel_bp.route('/list', methods=['GET'])
def get_novels():
    """获取所有小说名字，不包含章节信息"""
    novels = []
    
    if not os.path.exists(NOVEL_DIR):
        os.makedirs(NOVEL_DIR, exist_ok=True)
        return jsonify(novels)
    
    for novel_name in os.listdir(NOVEL_DIR):
        novel_path = os.path.join(NOVEL_DIR, novel_name)
        if os.path.isdir(novel_path):
            # 统计章节数量（txt文件）
            txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
            chapter_count = len(txt_files)
            
            novels.append({
                'name': novel_name,
                'display_name': novel_name.replace('_', ' ').title(),
                'chapter_count': chapter_count
            })
    
    return jsonify(novels)

# 获取所有章节
@novel_bp.route('/<novel_name>/chapters', methods=['GET'])
def get_chapters(novel_name):
    """获取指定小说的所有章节名字"""
    chapters = []
    
    novel_path = os.path.join(NOVEL_DIR, novel_name)
    if not os.path.exists(novel_path):
        return jsonify({'error': '小说不存在'}), 404
    
    # 扫描txt文件（中文原版）
    txt_files = sorted([f for f in os.listdir(novel_path) if f.endswith('.txt')])
    print("len of texts", len(txt_files))

    for txt_file in txt_files:
        info = __parse_novel_raw_name(txt_file)

        # 检查多语言版本的可用性
        available_languages = []
        for lang_code in ['en', 'sw', 'fr']:
            lang_file = f"{info['basename']}.{lang_code}.json"
            lang_path = os.path.join(novel_path, lang_file)
            if os.path.exists(lang_path):
                available_languages.append(lang_code)
        
        chapters.append({
            'cid': info['cid'],
            'title': info['title'],
            'available_languages': available_languages
        })
    
    # 按cid排序
    chapters.sort(key=lambda x: x['cid'])
    print("len of chapters:", len(chapters))
    
    return jsonify(chapters)


@novel_bp.route('/<novel_name>/chapters/raw/<int:cid>', methods=['GET'])
def get_raw_chapter(novel_name, cid):
    """获取指定章节的原始文本"""
    novel_path = os.path.join(NOVEL_DIR, novel_name)
    if not os.path.exists(novel_path):
        return jsonify({'error': '小说不存在'}), 404
    
    # 查找对应cid的txt文件
    txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
    target_file = None
    info = None
    for txt_file in txt_files:
        tinfo = __parse_novel_raw_name(txt_file)
        if tinfo['cid'] == cid:
            target_file = txt_file
            info = tinfo
            break
    
    if not target_file:
        return jsonify({'error': '章节不存在'}), 404
    
    txt_path = os.path.join(novel_path, target_file)
    try:
        with open(txt_path, 'r', encoding='utf-8') as f:
            content = f.read()
  
        return jsonify({
            'cid': cid,
            'title': info['title'],
            'content': content
        })
    except Exception as e:
        return jsonify({'error': f'读取文件失败: {str(e)}'}), 500

@novel_bp.route('/<novel_name>/chapters/<int:cid>/<language>', methods=['GET'])
def get_translated_chapter(novel_name, cid, language):
    """获取指定章节的翻译版本 (en|sw|fr)"""
    if language not in ['en', 'sw', 'fr']:
        return jsonify({'error': '不支持的语言代码'}), 400
    
    novel_path = os.path.join(NOVEL_DIR, novel_name)
    if not os.path.exists(novel_path):
        return jsonify({'error': '小说不存在'}), 404
    
    # 查找对应cid的文件
    txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
    target_base_name = None
    
    for txt_file in txt_files:
        info = __parse_novel_raw_name(txt_file)
        if info['cid'] == cid:
            target_base_name = info['basename']
            break

    if not target_base_name:
        return jsonify({'error': '章节不存在'}), 404
    
    # 查找对应的翻译文件
    lang_file = f"{target_base_name}.{language}.json"
    lang_path = os.path.join(novel_path, lang_file)
    
    if not os.path.exists(lang_path):
        return jsonify({'error': f'{language}语言版本不存在'}), 404

    try:
        print("load ", lang_path)
        with open(lang_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return jsonify(data)
    except Exception as e:
        return jsonify({'error': f'读取翻译文件失败: {str(e)}'}), 500

# ================= 章节管理API (增删查改) =================
@novel_bp.route('/<novel_name>/chapters/update', methods=['POST'])
def update_chapter_api(novel_name):
    """
    更新章节API - 支持增删查改
    数据结构: {
        "action": "create|update|delete",
        "cid": 章节ID,
        "title": 章节标题,
        "content": 章节内容
    }
    """
    try:
        data = request.get_json()
        action = data.get('action', '').lower()
        cid = data.get('cid')
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        
        if action not in ['create', 'update', 'delete']:
            return jsonify({'error': '无效的操作类型'}), 400
        
        if not cid or not isinstance(cid, int):
            return jsonify({'error': 'cid必须是整数'}), 400
        
        novel_path = os.path.join(NOVEL_DIR, novel_name)
        if not os.path.exists(novel_path):
            return jsonify({'error': '小说不存在'}), 404

        print("Op: ", action)
        if action == 'delete':
            return _delete_chapter(novel_path, novel_name, cid)
        elif action == 'create':
            if not title or not content:
                return jsonify({'error': '创建章节时标题和内容不能为空'}), 400
            return _create_chapter(novel_path, novel_name, cid, title, content)
        elif action == 'update':
            if not title or not content:
                return jsonify({'error': '更新章节时标题和内容不能为空'}), 400
            return _update_chapter(novel_path, novel_name, cid, title, content)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@novel_bp.route('/novels/create', methods=['POST'])
def create_novel():
    """创建新小说"""
    try:
        data = request.get_json()
        novel_name = data.get('name', '').strip()
        
        if not novel_name:
            return jsonify({'error': '小说名称不能为空'}), 400
        
        # 生成安全的目录名
        safe_name = novel_name.lower().replace(' ', '_')
        safe_name = ''.join(c for c in safe_name if c.isalnum() or c in ('_', '-'))
        
        # 创建小说目录
        novel_dir = os.path.join(NOVEL_DIR, safe_name)
        if os.path.exists(novel_dir):
            return jsonify({'error': '小说已存在'}), 400
        
        os.makedirs(novel_dir, exist_ok=True)
        
        return jsonify({
            'success': True, 
            'message': '小说创建成功',
            'name': safe_name
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def _create_chapter(novel_path, novel_name, cid, title, content):
    """创建新章节"""
    # 检查cid是否已存在
    txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
    for txt_file in txt_files:
        info = __parse_novel_raw_name(txt_file)
        if info['cid'] == cid:
            return jsonify({'error': f'章节CID {cid} 已存在'}), 400

    # 生成文件名：[novel_name]_[cid]_[title].txt
    safe_title = __gen_novel_raw_name(cid, title)
    file_path = os.path.join(novel_path, safe_title)

    # 保存章节内容
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return jsonify({
        'success': True, 
        'message': f'章节 {cid} 创建成功',
        'filename': file_path
    })

def _update_chapter(novel_path, novel_name, cid, title, content):
    """更新章节"""
    # 查找对应cid的文件
    txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
    target_file = None
    
    for txt_file in txt_files:
        info = __parse_novel_raw_name(txt_file)
        if info['cid'] == cid:
            target_file = txt_file
            break

    if not target_file:
        return jsonify({'error': f'章节CID {cid} 不存在'}), 404
    
    # 更新内容
    target_file = os.path.join(novel_path, target_file)
    with open(target_file, 'w', encoding='utf-8') as f:
        print("writing to file:", target_file)
        f.write(content)
    
    return jsonify({
        'success': True,
        'message': f'Chapter {title} updated successfully',
        'filename': target_file
    })

def _delete_chapter(novel_path, novel_name, cid):
    """删除章节"""
    # 查找对应cid的文件
    txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
    target_file = None
    
    for txt_file in txt_files:
        info = __parse_novel_raw_name(txt_file)
        if info['cid'] == cid:
            target_file = txt_file
            break
    
    if not target_file:
        return jsonify({'error': f'章节CID {cid} 不存在'}), 404
    
    # 删除txt文件
    file_path = os.path.join(novel_path, target_file)
    os.remove(file_path)
    
    # 删除相关的翻译文件
    base_name = target_file.replace(".txt", "")
    for lang in ['en', 'sw', 'fr']:
        lang_file = f"{base_name}.{lang}.json"
        lang_path = os.path.join(novel_path, lang_file)
        if os.path.exists(lang_path):
            os.remove(lang_path)
    
    return jsonify({
        'success': True,
        'message': f'章节 {cid} 删除成功'
    })
