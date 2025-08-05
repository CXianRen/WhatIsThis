# ================= 翻译API路由模块 =================
from flask import Blueprint, jsonify, request
import time
from translation_service import (
    add_translation_task, 
    get_translation_status, 
    stop_translation_task,
    stop_all_translation_tasks,
    clear_stopped_tasks,
    SUPPORTED_LANGUAGES
)

# 创建蓝图
translation_bp = Blueprint('translation', __name__, url_prefix='/api')

@translation_bp.route('/novels/<novel_name>/chapters/<int:chapter_id>/translate/<lang_code>', methods=['POST'])
def translate_chapter(novel_name, chapter_id, lang_code):
    """将章节翻译成指定语言并保存（异步处理）"""
    try:
        if lang_code not in SUPPORTED_LANGUAGES:
            return jsonify({'error': '不支持的语言代码'}), 400
        
        from config import NOVEL_DIR
        import os
        
        novel_dir = os.path.join(NOVEL_DIR, novel_name)
        if not os.path.exists(novel_dir):
            return jsonify({'error': '小说不存在'}), 404
        
        # 找到对应的txt文件
        txt_files = sorted([f for f in os.listdir(novel_dir) if f.endswith('.txt')])
        if chapter_id <= 0 or chapter_id > len(txt_files):
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

@translation_bp.route('/translation/batch', methods=['POST'])
def start_batch_translation():
    """启动批量翻译任务"""
    try:
        data = request.get_json()
        tasks = data.get('tasks', [])
        overwrite_mode = data.get('overwrite_mode', 'ask')
        
        if not tasks:
            return jsonify({'error': '没有提供翻译任务'}), 400
        
        batch_id = f"batch_{int(time.time())}"
        task_ids = []
        
        for task_data in tasks:
            novel_name = task_data.get('novel_name')
            chapter_id = task_data.get('chapter_id')
            target_language = task_data.get('target_language')
            
            if not all([novel_name, chapter_id, target_language]):
                continue
            
            # 生成任务ID
            task_id = f"{novel_name}_{chapter_id}_{target_language}_{int(time.time())}_{len(task_ids)}"
            
            # 添加翻译任务到队列
            add_translation_task(
                task_id, 
                novel_name, 
                chapter_id, 
                target_language, 
                overwrite_mode in ['overwrite', 'ask']
            )
            task_ids.append(task_id)
        
        print(f"批量翻译任务已加入队列: {batch_id}, 任务数量: {len(task_ids)}")
        
        return jsonify({
            'success': True,
            'batch_id': batch_id,
            'task_ids': task_ids,
            'message': f'批量翻译任务已启动，共 {len(task_ids)} 个任务'
        })
        
    except Exception as e:
        print(f"创建批量翻译任务失败: {e}")
        return jsonify({'error': str(e)}), 500

@translation_bp.route('/translation/batch/status', methods=['POST'])
def get_batch_translation_status():
    """获取批量翻译任务状态"""
    try:
        data = request.get_json()
        task_ids = data.get('task_ids', [])
        
        if not task_ids:
            return jsonify({'error': '没有提供任务ID'}), 400
        
        results = {}
        total_progress = 0
        status_counts = {'queued': 0, 'processing': 0, 'completed': 0, 'failed': 0}
        
        for task_id in task_ids:
            status = get_translation_status(task_id)
            if status:
                results[task_id] = status
                total_progress += status['progress']
                status_counts[status['status']] += 1
        
        overall_progress = total_progress / len(task_ids) if task_ids else 0
        
        return jsonify({
            'success': True,
            'overall_progress': overall_progress,
            'status_counts': status_counts,
            'task_results': results
        })
        
    except Exception as e:
        print(f"获取批量翻译状态失败: {e}")
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

@translation_bp.route('/translation/stop-all', methods=['POST'])
def stop_all_translation_tasks_api():
    """停止所有翻译任务"""
    try:
        stopped_count = stop_all_translation_tasks()
        
        return jsonify({
            'success': True,
            'message': f'已停止 {stopped_count} 个翻译任务',
            'stopped_count': stopped_count
        })
        
    except Exception as e:
        print(f"停止所有翻译任务失败: {e}")
        return jsonify({'error': str(e)}), 500

@translation_bp.route('/translation/clear-stopped', methods=['POST'])
def clear_stopped_tasks_api():
    """清理已停止的任务记录"""
    try:
        clear_stopped_tasks()
        
        return jsonify({
            'success': True,
            'message': '已清理停止的任务记录'
        })
        
    except Exception as e:
        print(f"清理停止任务记录失败: {e}")
        return jsonify({'error': str(e)}), 500
