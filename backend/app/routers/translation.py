# ================= Translation API Route Module =================
import time
import os
from flask import Blueprint, jsonify, request
from service.translation_service import (
    add_translation_task, 
    get_translation_status, 
    stop_translation_task,
    SUPPORTED_LANGUAGES,
    NOVEL_DIR
)

from .novel import __parse_novel_raw_name

# Create blueprint
translation_bp = Blueprint('translation', __name__, url_prefix='/api')

@translation_bp.route('/novels/<novel_name>/chapters/<int:chapter_id>/translate/<lang_code>', methods=['POST'])
def translate_chapter(novel_name, chapter_id, lang_code):
    """Translate a chapter into the specified language and save (asynchronous processing)"""
    try:
        if lang_code not in SUPPORTED_LANGUAGES:
            return jsonify({'error': 'Unsupported language code'}), 400
                
        novel_dir = os.path.join(NOVEL_DIR, novel_name)
        if not os.path.exists(novel_dir):
            return jsonify({'error': 'Novel does not exist'}), 404
        
        # Use the new file naming format to find the chapter file
        txt_files = [f for f in os.listdir(novel_dir) if f.endswith('.txt')]
        target_file = None
        
        for txt_file in txt_files:
            info = __parse_novel_raw_name(txt_file)
            if info['cid'] == chapter_id:
                target_file = txt_file
                break

        if not target_file:
            return jsonify({'error': 'Chapter does not exist'}), 404
        
        # Check if overwrite is allowed
        data = request.get_json() or {}
        overwrite = data.get('overwrite', False)
        
        # Generate task ID
        task_id = f"{novel_name}_{chapter_id}_{lang_code}_{int(time.time())}"
        
        # Add translation task to queue
        add_translation_task(task_id, novel_name, chapter_id, lang_code, overwrite)
        
        print(f"Translation task added to queue: {task_id}")
        
        return jsonify({
            'success': True,
            'task_id': task_id,
            'message': f'Translation task started, task ID: {task_id}',
            'language_name': SUPPORTED_LANGUAGES[lang_code]['name']
        })
        
    except Exception as e:
        print(f"Failed to create translation task: {e}")
        return jsonify({'error': str(e)}), 500

@translation_bp.route('/translation/status/<task_id>', methods=['GET'])
def get_translation_status_api(task_id):
    """Get translation task status and progress"""
    try:
        status = get_translation_status(task_id)
        if status is None:
            return jsonify({'error': 'Task does not exist'}), 404
        
        return jsonify(status)
        
    except Exception as e:
        print(f"Failed to get translation status: {e}")
        return jsonify({'error': str(e)}), 500


@translation_bp.route('/supported-languages', methods=['GET'])
def get_supported_languages():
    """Get list of supported languages"""
    return jsonify(SUPPORTED_LANGUAGES)

@translation_bp.route('/translation/stop/<task_id>', methods=['POST'])
def stop_translation_task_api(task_id):
    """Stop the specified translation task"""
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
        print(f"Failed to stop translation task: {e}")
        return jsonify({'error': str(e)}), 500

