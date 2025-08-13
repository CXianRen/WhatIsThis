# ================= 翻译API路由模块 =================
import time
import os
from flask import Blueprint, jsonify, request
from service.translation_service import (
    add_translation_task, 
    get_translation_status, 
    stop_translation_task,
    stop_all_translation_tasks,
    clear_stopped_tasks,
    SUPPORTED_LANGUAGES,
    NOVEL_DIR
)


from .novel import __parse_novel_raw_name, __gen_novel_raw_name

# 创建蓝图
translation_bp = Blueprint('translation', __name__, url_prefix='/api')

@translation_bp.route('/novels/<novel_name>/chapters/<int:chapter_id>/translate/<lang_code>', methods=['POST'])
def translate_chapter(novel_name, chapter_id, lang_code):
    """将章节翻译成指定语言并保存（异步处理）"""
    try:
        if lang_code not in SUPPORTED_LANGUAGES:
            return jsonify({'error': '不支持的语言代码'}), 400
                
        novel_dir = os.path.join(NOVEL_DIR, novel_name)
        if not os.path.exists(novel_dir):
            return jsonify({'error': '小说不存在'}), 404
        
        # 使用新的文件命名格式查找章节文件
        txt_files = [f for f in os.listdir(novel_dir) if f.endswith('.txt')]
        target_file = None
        
        for txt_file in txt_files:
            info = __parse_novel_raw_name(txt_file)
            if info['cid'] == chapter_id:
                target_file = txt_file
                break

        if not target_file:
            return jsonify({'error': '章节不存在'}), 404
        
        # 检查是否允许覆盖
        data = request.get_json() or {}
        overwrite = data.get('overwrite', False)
        
        # 生成任务ID
        task_id = f"{novel_name}_{chapter_id}_{lang_code}_{int(time.time())}"
        
        # 添加翻译任务到队列
        add_translation_task(task_id, novel_name, chapter_id, lang_code, overwrite)
        
        print(f"翻译任务已加入队列: {task_id}")
        
        return jsonify({
            'success': True,
            'task_id': task_id,
            'message': f'翻译任务已启动，任务ID: {task_id}',
            'language_name': SUPPORTED_LANGUAGES[lang_code]['name']
        })
        
    except Exception as e:
        print(f"创建翻译任务失败: {e}")
        return jsonify({'error': str(e)}), 500

@translation_bp.route('/translation/status/<task_id>', methods=['GET'])
def get_translation_status_api(task_id):
    """获取翻译任务状态和进度"""
    try:
        status = get_translation_status(task_id)
        if status is None:
            return jsonify({'error': '任务不存在'}), 404
        
        return jsonify(status)
        
    except Exception as e:
        print(f"获取翻译状态失败: {e}")
        return jsonify({'error': str(e)}), 500


@translation_bp.route('/supported-languages', methods=['GET'])
def get_supported_languages():
    """获取支持的语言列表"""
    return jsonify(SUPPORTED_LANGUAGES)

@translation_bp.route('/translation/stop/<task_id>', methods=['POST'])
def stop_translation_task_api(task_id):
    """停止指定的翻译任务"""
    try:
        success, message = stop_translation_task(task_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
            
    except Exception as e:
        print(f"停止翻译任务失败: {e}")
        return jsonify({'error': str(e)}), 500
