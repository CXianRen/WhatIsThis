# ================= 小说管理和阅读路由模块 =================
from flask import Blueprint, jsonify, request
import os
import json
import re
from config import NOVEL_DIR

# ================= 小说阅读蓝图 =================
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
            
            # 扫描txt文件（原始中文章节）
            txt_files = sorted([f for f in os.listdir(novel_path) if f.endswith('.txt')])
            for txt_file in txt_files:
                base_name = txt_file[:-4]  # 去掉.txt扩展名
                
                # 检查该章节的翻译版本
                translations = []
                for lang_code in ['en', 'se', 'fr']:
                    lang_file = f"{base_name}.{lang_code}.json"
                    lang_path = os.path.join(novel_path, lang_file)
                    if os.path.exists(lang_path):
                        translations.append({
                            'lang': lang_code,
                            'file': lang_file,
                            'path': f'{novel_name}/{lang_file}'
                        })
                
                chapters.append({
                    'name': base_name,
                    'path': f'{novel_name}/{txt_file}',
                    'type': 'txt',
                    'translations': translations
                })
            
            # 兼容传统的章节目录（旧格式）
            for item_name in sorted(os.listdir(novel_path)):
                item_path = os.path.join(novel_path, item_name)
                if os.path.isdir(item_path):
                    # 检查是否有en.json文件
                    en_json_path = os.path.join(item_path, 'en.json')
                    if os.path.exists(en_json_path):
                        chapters.append({
                            'name': item_name,
                            'path': f'{novel_name}/{item_name}',
                            'type': 'json',
                            'translations': []
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
        novel_path = os.path.join(NOVEL_DIR, novel_name)
        
        # 如果章节名称没有扩展名，尝试找到对应的文件
        if not any(chapter_name.endswith(ext) for ext in ['.txt', '.en.json', '.se.json', '.fr.json']):
            # 尝试找英文翻译文件
            en_file = f"{chapter_name}.en.json"
            en_path = os.path.join(novel_path, en_file)
            if os.path.exists(en_path):
                chapter_name = en_file
            else:
                # 尝试找txt文件
                txt_file = f"{chapter_name}.txt"
                txt_path = os.path.join(novel_path, txt_file)
                if os.path.exists(txt_path):
                    chapter_name = txt_file
                else:
                    return jsonify({'error': f'Chapter not found: {chapter_name}'}), 404
        
        # 处理新的翻译文件格式 (.en.json, .se.json, .fr.json)
        if any(chapter_name.endswith(f'.{lang}.json') for lang in ['en', 'se', 'fr']):
            json_path = os.path.join(novel_path, chapter_name)
            if os.path.exists(json_path):
                with open(json_path, 'r', encoding='utf-8') as f:
                    translation_data = json.load(f)
                
                # 新格式：content是数组，包含 {id, src, target} 结构
                if 'content' in translation_data and isinstance(translation_data['content'], list):
                    sentences = []
                    for item in translation_data['content']:
                        if isinstance(item, dict) and 'src' in item and 'target' in item:
                            sentences.append({
                                'text': item['src'],
                                'translation': item['target']
                            })
                    
                    return jsonify({
                        'title': translation_data.get('title', chapter_name),
                        'original_title': translation_data.get('original_title', ''),
                        'language': translation_data.get('language', ''),
                        'language_name': translation_data.get('language_name', ''),
                        'sentences': sentences
                    })
        
        # 处理txt文件格式（原始中文）
        if chapter_name.endswith('.txt'):
            txt_path = os.path.join(novel_path, chapter_name)
            if os.path.exists(txt_path):
                with open(txt_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 从文件名获取标题（去掉.txt扩展名）
                base_name = chapter_name[:-4]
                title = base_name
                
                # 尝试从对应的英文翻译文件获取更好的标题
                en_file = f"{base_name}.en.json"
                en_path = os.path.join(novel_path, en_file)
                if os.path.exists(en_path):
                    try:
                        with open(en_path, 'r', encoding='utf-8') as f:
                            en_data = json.load(f)
                            if 'original_title' in en_data and en_data['original_title']:
                                title = en_data['original_title']
                            elif 'title' in en_data and en_data['title']:
                                title = en_data['title']
                    except:
                        pass
                
                # 将内容按句号分割
                sentences_text = re.split(r'[。！？]', content.strip())
                sentences_text = [s.strip() for s in sentences_text if s.strip()]
                
                # 转换为阅读器期望的格式
                sentences = []
                for sentence in sentences_text:
                    if sentence:
                        sentences.append({
                            'text': sentence + '。',
                            'translation': ''  # txt格式没有翻译
                        })
                
                return jsonify({
                    'title': title,
                    'original_title': title,
                    'language': 'zh',
                    'language_name': '中文',
                    'sentences': sentences
                })
        
        # 兼容旧的json格式（目录结构）
        chapter_path = os.path.join(novel_path, chapter_name)
        if os.path.isdir(chapter_path):
            en_json_path = os.path.join(chapter_path, 'en.json')
            if os.path.exists(en_json_path):
                with open(en_json_path, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                return jsonify(content)
        
        return jsonify({'error': '章节文件不存在'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ================= 小说管理API蓝图 =================
novel_api_bp = Blueprint('novel_api', __name__, url_prefix='/api/novels')

@novel_api_bp.route('', methods=['GET'])
def get_novels():
    """获取所有小说名字列表"""
    novels = []
    
    if not os.path.exists(NOVEL_DIR):
        os.makedirs(NOVEL_DIR, exist_ok=True)
        return jsonify(novels)
    
    for novel_name in os.listdir(NOVEL_DIR):
        novel_path = os.path.join(NOVEL_DIR, novel_name)
        if os.path.isdir(novel_path):
            # 统计章节数量
            txt_files = [f for f in os.listdir(novel_path) if f.endswith('.txt')]
            chapter_count = len(txt_files)
            
            novels.append({
                'id': len(novels) + 1,
                'name': novel_name,
                'displayName': novel_name.replace('_', ' ').title(),
                'chapterCount': chapter_count
            })
    
    return jsonify(novels)

@novel_api_bp.route('/<novel_name>/chapters', methods=['GET'])
def get_novel_chapters(novel_name):
    """获取指定小说的所有章节"""
    chapters = []
    
    novel_path = os.path.join(NOVEL_DIR, novel_name)
    if not os.path.exists(novel_path):
        return jsonify({'error': '小说不存在'}), 404
    
    # 扫描txt文件（中文原版）
    txt_files = sorted([f for f in os.listdir(novel_path) if f.endswith('.txt')])
    
    for i, txt_file in enumerate(txt_files):
        txt_path = os.path.join(novel_path, txt_file)
        base_name = txt_file[:-4]  # 去掉.txt扩展名
        
        # 从文件名获取基础标题
        title = base_name
        
        # 尝试从对应的英文翻译文件获取更好的标题
        en_file = base_name + '.en.json'
        en_path = os.path.join(novel_path, en_file)
        if os.path.exists(en_path):
            try:
                with open(en_path, 'r', encoding='utf-8') as f:
                    en_data = json.load(f)
                    if 'original_title' in en_data and en_data['original_title']:
                        title = en_data['original_title']
                    elif 'title' in en_data and en_data['title']:
                        title = en_data['title']
            except:
                pass
        
        # 读取中文章节内容
        content = ""
        try:
            with open(txt_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            pass
        
        # 检查多语言版本
        languages = {}
        for lang_code, lang_ext in [('en', '.en.json'), ('se', '.se.json'), ('fr', '.fr.json')]:
            lang_file = base_name + lang_ext
            lang_path = os.path.join(novel_path, lang_file)
            if os.path.exists(lang_path):
                try:
                    with open(lang_path, 'r', encoding='utf-8') as f:
                        lang_data = json.load(f)
                        languages[lang_code] = {
                            'title': lang_data.get('title', title),
                            'content': lang_data.get('content', ''),
                            'filename': lang_file
                        }
                except:
                    pass
        
        chapters.append({
            'id': i + 1,
            'title': title,
            'content': content,
            'filename': txt_file,
            'languages': languages,
            'createdAt': txt_file  # 使用文件名作为创建时间标识
        })
    
    return jsonify(chapters)

@novel_api_bp.route('', methods=['POST'])
def create_novel():
    """创建新小说"""
    try:
        data = request.get_json()
        novel_name = data.get('name', '').strip()
        
        if not novel_name:
            return jsonify({'error': '小说名称不能为空'}), 400
        
        # 创建小说目录
        novel_dir = os.path.join(NOVEL_DIR, novel_name)
        if os.path.exists(novel_dir):
            return jsonify({'error': '小说已存在'}), 400
        
        os.makedirs(novel_dir, exist_ok=True)
        
        return jsonify({'success': True, 'message': '小说创建成功'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@novel_api_bp.route('/<novel_name>/chapters', methods=['POST'])
def create_chapter(novel_name):
    """创建新章节"""
    try:
        data = request.get_json()
        chapter_title = data.get('title', '').strip()
        chapter_content = data.get('content', '').strip()
        
        if not chapter_title or not chapter_content:
            return jsonify({'error': '章节标题和内容不能为空'}), 400
        
        novel_dir = os.path.join(NOVEL_DIR, novel_name)
        if not os.path.exists(novel_dir):
            return jsonify({'error': '小说不存在'}), 404
        
        # 生成章节序号
        existing_files = [f for f in os.listdir(novel_dir) if f.endswith('.txt')]
        chapter_num = len(existing_files) + 1
        
        # 清理章节标题中的特殊字符，用于文件名
        safe_title = "".join(c for c in chapter_title if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_title = safe_title.replace(' ', '_')
        
        # 生成文件名：书名_章节_章名.txt
        filename = f"{novel_name}_{chapter_num:03d}_{safe_title}.txt"
        file_path = os.path.join(novel_dir, filename)
        
        # 保存章节内容到txt文件
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"{chapter_content}")
        
        return jsonify({'success': True, 'message': '章节创建成功'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@novel_api_bp.route('/<novel_name>/chapters/<int:chapter_id>', methods=['PUT'])
def update_chapter(novel_name, chapter_id):
    """更新章节"""
    try:
        data = request.get_json()
        chapter_title = data.get('title', '').strip()
        chapter_content = data.get('content', '').strip()
        
        if not chapter_title or not chapter_content:
            return jsonify({'error': '章节标题和内容不能为空'}), 400
        
        novel_dir = os.path.join(NOVEL_DIR, novel_name)
        if not os.path.exists(novel_dir):
            return jsonify({'error': '小说不存在'}), 404
        
        # 找到对应的txt文件
        txt_files = sorted([f for f in os.listdir(novel_dir) if f.endswith('.txt')])
        if chapter_id <= 0 or chapter_id > len(txt_files):
            return jsonify({'error': '章节不存在'}), 404
        
        file_path = os.path.join(novel_dir, txt_files[chapter_id - 1])
        
        # 更新文件内容
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"{chapter_content}")
        
        return jsonify({'success': True, 'message': '章节更新成功'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@novel_api_bp.route('/<novel_name>/chapters/<int:chapter_id>', methods=['DELETE'])
def delete_chapter(novel_name, chapter_id):
    """删除章节"""
    try:
        novel_dir = os.path.join(NOVEL_DIR, novel_name)
        if not os.path.exists(novel_dir):
            return jsonify({'error': '小说不存在'}), 404
        
        # 找到对应的txt文件
        txt_files = sorted([f for f in os.listdir(novel_dir) if f.endswith('.txt')])
        if chapter_id <= 0 or chapter_id > len(txt_files):
            return jsonify({'error': '章节不存在'}), 404
        
        file_path = os.path.join(novel_dir, txt_files[chapter_id - 1])
        
        # 删除txt文件
        os.remove(file_path)
        
        # 同时删除相关的多语言文件
        base_name = txt_files[chapter_id - 1][:-4]
        for lang_ext in ['.en.json', '.se.json', '.fr.json']:
            lang_file = os.path.join(novel_dir, base_name + lang_ext)
            if os.path.exists(lang_file):
                os.remove(lang_file)
        
        return jsonify({'success': True, 'message': '章节删除成功'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ================= 多语言版本管理API =================
@novel_api_bp.route('/<novel_name>/chapters/<int:chapter_id>/languages/<lang_code>', methods=['POST'])
def add_language_version(novel_name, chapter_id, lang_code):
    """为章节添加语言版本"""
    try:
        data = request.get_json()
        content = data.get('content', '').strip()
        
        if not content:
            return jsonify({'error': '内容不能为空'}), 400
        
        # 支持的语言
        supported_languages = {
            'en': '.en.json',
            'se': '.se.json', 
            'fr': '.fr.json'
        }
        
        if lang_code not in supported_languages:
            return jsonify({'error': '不支持的语言代码'}), 400
        
        novel_dir = os.path.join(NOVEL_DIR, novel_name)
        if not os.path.exists(novel_dir):
            return jsonify({'error': '小说不存在'}), 404
        
        # 找到对应的txt文件
        txt_files = sorted([f for f in os.listdir(novel_dir) if f.endswith('.txt')])
        if chapter_id <= 0 or chapter_id > len(txt_files):
            return jsonify({'error': '章节不存在'}), 404
        
        base_name = txt_files[chapter_id - 1][:-4]
        
        # 从文件名获取原始章节标题
        original_title = base_name
        
        # 尝试从已有的英文翻译文件获取更好的标题
        existing_en_file = base_name + '.en.json'
        existing_en_path = os.path.join(novel_dir, existing_en_file)
        if os.path.exists(existing_en_path):
            try:
                with open(existing_en_path, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
                    if 'original_title' in existing_data and existing_data['original_title']:
                        original_title = existing_data['original_title']
            except:
                pass
        
        # 创建语言版本文件
        lang_file = base_name + supported_languages[lang_code]
        lang_path = os.path.join(novel_dir, lang_file)
        
        # 标题直接使用原始标题，内容使用用户提供的完整内容
        title = original_title
        body = content
        
        lang_data = {
            'title': title,
            'content': body,
            'language': lang_code,
            'original_title': original_title
        }
        
        with open(lang_path, 'w', encoding='utf-8') as f:
            json.dump(lang_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True, 'message': f'{lang_code.upper()}版本保存成功'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@novel_api_bp.route('/<novel_name>/chapters/<int:chapter_id>/languages/<lang_code>', methods=['DELETE'])
def delete_language_version(novel_name, chapter_id, lang_code):
    """删除章节的语言版本"""
    try:
        # 支持的语言
        supported_languages = {
            'en': '.en.json',
            'se': '.se.json', 
            'fr': '.fr.json'
        }
        
        if lang_code not in supported_languages:
            return jsonify({'error': '不支持的语言代码'}), 400
        
        novel_dir = os.path.join(NOVEL_DIR, novel_name)
        if not os.path.exists(novel_dir):
            return jsonify({'error': '小说不存在'}), 404
        
        # 找到对应的txt文件
        txt_files = sorted([f for f in os.listdir(novel_dir) if f.endswith('.txt')])
        if chapter_id <= 0 or chapter_id > len(txt_files):
            return jsonify({'error': '章节不存在'}), 404
        
        base_name = txt_files[chapter_id - 1][:-4]
        lang_file = base_name + supported_languages[lang_code]
        lang_path = os.path.join(novel_dir, lang_file)
        
        if not os.path.exists(lang_path):
            return jsonify({'error': '语言版本不存在'}), 404
        
        os.remove(lang_path)
        
        return jsonify({'success': True, 'message': f'{lang_code.upper()}版本删除成功'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
