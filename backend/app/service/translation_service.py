# ================= Translation Service Module (Simplified) =================
import re
import time
import json
import requests
import threading
from config.config import (
    TRANSLATION_API_KEY, 
    TRANSLATION_API_URL, 
    SUPPORTED_LANGUAGES,
    NOVEL_DIR)

from routers.novel import __parse_novel_raw_name
import os
import json
    
    
# Simplified translation management
translation_results = {}  # Store translation results and progress
current_task = None  # Currently processing task
processing_lock = threading.Lock()  # Ensure only one task is running

def split_sentences(text: str) -> list:
    """Split text into a list of sentences by punctuation"""
    sentences = re.split(r'[。！？]', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    return sentences

def translate_sentences_batch(sentences: list, target_language: str, retry_times: int = 3) -> list:
    """Batch translate sentences, up to 10 sentences per request"""
    if target_language not in SUPPORTED_LANGUAGES:
        return [f"[Unsupported language] {sentence}" for sentence in sentences]
    
    headers = {
        "Authorization": f"Bearer {TRANSLATION_API_KEY}",
        "Content-Type": "application/json"
    }
    
    language_config = SUPPORTED_LANGUAGES[target_language]
    
    # Build JSON input
    sentences_json = {
        "sentences": [{"id": i+1, "text": sentence} for i, sentence in enumerate(sentences)]
    }
    
    prompt = f"""{language_config['prompt']}.

Please translate the following list of sentences in JSON format, and return the same JSON structure:

Input:
{json.dumps(sentences_json, ensure_ascii=False, indent=2)}

Requirements:
1. Return the same JSON structure
2. Keep the id field unchanged
3. Translate the text field to the target language
4. Only return JSON, no extra explanation"""
    
    data = {
        "model": "deepseek-chat",
        "messages": [
            {
                "role": "system", 
                "content": "You are a professional translation assistant. You must return valid JSON format only."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 2000,
        "temperature": 0.1,
        "stream": False
    }
    
    for attempt in range(retry_times):
        try:
            response = requests.post(TRANSLATION_API_URL, headers=headers, json=data, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                if 'choices' in result and len(result['choices']) > 0:
                    translated_content = result['choices'][0]['message']['content'].strip()
                    
                    # Try to parse JSON response
                    try:
                        # Clean possible markdown code block markers
                        if translated_content.startswith('```json'):
                            translated_content = translated_content.replace('```json', '').replace('```', '')
                        elif translated_content.startswith('```'):
                            translated_content = translated_content.replace('```', '', 1).replace('```', '')
                        
                        translated_content = translated_content.strip()
                        translated_json = json.loads(translated_content)
                        
                        if 'sentences' in translated_json:
                            # Sort by id and extract translated text
                            sorted_sentences = sorted(translated_json['sentences'], key=lambda x: x.get('id', 0))
                            return [item.get('text', f'[Translation failed] {sentences[i]}') for i, item in enumerate(sorted_sentences)]
                        else:
                            print(f"JSON structure error: {translated_json}")
                            
                    except json.JSONDecodeError as e:
                        print(f"JSON parse failed: {e}")
                        print(f"Raw response: {translated_content}")
                        
                else:
                    print(f"API response format error: {result}")
            else:
                print(f"API request failed, status code: {response.status_code}")
                print(f"Response content: {response.text}")
                
        except requests.exceptions.Timeout:
            print(f"Request timeout, retry {attempt + 1} ...")
        except requests.exceptions.RequestException as e:
            print(f"Request exception: {e}")
        except Exception as e:
            print(f"Unknown error: {e}")
        
        if attempt < retry_times - 1:
            time.sleep(3)
    
    return [f"[Translation failed] {sentence}" for sentence in sentences]

def translate_chapter_content_with_progress(content: str, target_language: str, task_id: str = None) -> dict:
    """Translate entire chapter content (with progress tracking, optimized)"""
    print(f"Start translating chapter to {target_language}")
    
    sentences = split_sentences(content)
    print(f"Split into {len(sentences)} sentences")
    
    translated_sentences = []
    batch_size = 10
    total_batches = (len(sentences) + batch_size - 1) // batch_size
    
    # Process sentences in batches
    for i in range(0, len(sentences), batch_size):
        batch = sentences[i:i + batch_size]
        batch_num = i // batch_size + 1
        
        print(f"Translating batch {batch_num}/{total_batches} ({len(batch)} sentences)...")
        
        # Update progress (50% + 40% * current batch progress)
        if task_id and task_id in translation_results:
            progress = 50 + int(40 * batch_num / total_batches)
            translation_results[task_id]['progress'] = min(progress, 90)
        
        # Batch translation
        translated_batch = translate_sentences_batch(batch, target_language)
        translated_sentences.extend(translated_batch)
        
        # Delay between batches
        if i + batch_size < len(sentences):
            time.sleep(1)
    
    # Create bilingual content (one-to-one mapping)
    bilingual_content = []
    for i, (original, translated) in enumerate(zip(sentences, translated_sentences)):
        bilingual_content.append({
            "id": i + 1,
            "src": original,
            "target": translated
        })
    
    print(f"Translation finished, processed {len(sentences)} sentences, sent {total_batches} API requests")
    
    return {
        'content': bilingual_content,
        'language': target_language,
        'total_sentences': len(sentences),
        'processed_time': time.strftime("%Y-%m-%d %H:%M:%S")
    }

def process_translation_task(task):
    """Process a single translation task (synchronous, no queue)"""

    
    task_id = task['task_id']
    
    try:
        # Update task status
        translation_results[task_id]['status'] = 'processing'
        translation_results[task_id]['progress'] = 10
        translation_results[task_id]['start_time'] = time.time()
        
        novel_name = task['novel_name']
        chapter_id = task['chapter_id']  # actual cid
        lang_code = task['lang_code']
        overwrite = task.get('overwrite', False)
        
        novel_dir = os.path.join(NOVEL_DIR, novel_name)
        
        # Use parse function from novel.py to find chapter file
        txt_files = [f for f in os.listdir(novel_dir) if f.endswith('.txt')]
        target_file = None
        target_info = None
        
        for txt_file in txt_files:
            try:
                info = __parse_novel_raw_name(txt_file)
                if info['cid'] == chapter_id:
                    target_file = txt_file
                    target_info = info
                    break
            except (ValueError, IndexError, KeyError):
                continue
        
        if not target_file:
            raise Exception('Chapter does not exist')
        
        # Check if target language file already exists
        target_filename = f"{target_info['basename']}.{lang_code}.json"
        target_path = os.path.join(novel_dir, target_filename)
        
        if os.path.exists(target_path) and not overwrite:
            translation_results[task_id]['status'] = 'failed'
            translation_results[task_id]['error'] = f'{SUPPORTED_LANGUAGES[lang_code]["name"]} version already exists'
            translation_results[task_id]['end_time'] = time.time()
            return
        
        # Update progress
        translation_results[task_id]['progress'] = 20
        
        # Read original content
        txt_path = os.path.join(novel_dir, target_file)
        with open(txt_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Use parsed title
        title = target_info['title']
        
        # Try to get better title from existing English translation file
        existing_en_file = f"{target_info['basename']}.en.json"
        existing_en_path = os.path.join(novel_dir, existing_en_file)
        if os.path.exists(existing_en_path):
            try:
                with open(existing_en_path, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
                    if 'original_title' in existing_data and existing_data['original_title']:
                        title = existing_data['original_title']
            except:
                pass
        
        body_content = content
        
        # Update progress
        translation_results[task_id]['progress'] = 30
        
        # Translate title and content
        print(f"Start translating chapter {title} to {SUPPORTED_LANGUAGES[lang_code]['name']}")
        
        # Batch translate title
        translated_title = ''
        if title:
            title_result = translate_sentences_batch([title], lang_code)
            translated_title = title_result[0] if title_result else title
        
        translation_results[task_id]['progress'] = 50
        
        # Batch translate chapter content
        translation_result = translate_chapter_content_with_progress(body_content, lang_code, task_id)
        
        translation_results[task_id]['progress'] = 90
        
        # Prepare translation data (bilingual format)
        translation_data = {
            'title': translated_title,
            'content': translation_result['content'],  # already bilingual format
            'original_title': title,
            'language': lang_code,
            'language_name': SUPPORTED_LANGUAGES[lang_code]['name'],
            'total_sentences': translation_result['total_sentences'],
            'translated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'processed_time': translation_result['processed_time']
        }
        
        # Save translation result to JSON file
        with open(target_path, 'w', encoding='utf-8') as f:
            json.dump(translation_data, f, ensure_ascii=False, indent=2)
        
        # Update task completed status
        translation_results[task_id]['status'] = 'completed'
        translation_results[task_id]['progress'] = 100
        translation_results[task_id]['end_time'] = time.time()
        translation_results[task_id]['result'] = translation_data
        translation_results[task_id]['filename'] = target_filename
        
        print(f"Translation completed and saved to: {target_path}")
        
    except Exception as e:
        print(f"Translation task failed: {e}")
        translation_results[task_id]['status'] = 'failed'
        translation_results[task_id]['error'] = str(e)
        translation_results[task_id]['end_time'] = time.time()

def add_translation_task(task_id, novel_name, chapter_id, lang_code, overwrite=False):
    """Add a translation task and execute immediately (simplified)"""
    global current_task
    
    # Check if a task is running
    with processing_lock:
        if current_task is not None:
            # If a task is running, return error
            return None
        
        # Initialize task status
        translation_results[task_id] = {
            'task_id': task_id,
            'novel_name': novel_name,
            'chapter_id': chapter_id,
            'lang_code': lang_code,
            'status': 'queued',
            'progress': 0,
            'start_time': None,
            'end_time': None,
            'error': None,
            'result': None,
            'filename': None
        }
        
        # Create translation task
        task = {
            'task_id': task_id,
            'novel_name': novel_name,
            'chapter_id': chapter_id,
            'lang_code': lang_code,
            'overwrite': overwrite
        }
        
        current_task = task_id
    
    # Run translation in background thread
    def run_translation():
        global current_task
        try:
            process_translation_task(task)
        finally:
            current_task = None
    
    thread = threading.Thread(target=run_translation, daemon=True)
    thread.start()
    
    return task_id

def get_translation_status(task_id):
    """Get translation task status"""
    if task_id not in translation_results:
        return None
    
    task = translation_results[task_id]
    
    # Calculate estimated time
    estimated_time = None
    if task['status'] == 'processing' and task['start_time'] and task['progress'] > 0:
        elapsed_time = time.time() - task['start_time']
        if task['progress'] > 0:
            total_estimated_time = (elapsed_time / task['progress']) * 100
            estimated_time = max(0, total_estimated_time - elapsed_time)
    
    result = {
        'task_id': task_id,
        'status': task['status'],
        'progress': task['progress'],
        'estimated_time': estimated_time,
        'error': task['error']
    }
    
    # If task completed, include result info
    if task['status'] == 'completed':
        result['result'] = {
            'filename': task['filename'],
            'language_name': SUPPORTED_LANGUAGES[task['lang_code']]['name']
        }
    
    return result

def stop_translation_task(task_id):
    """Stop translation task (simplified: only mark as failed)"""
    if task_id not in translation_results:
        return False, "Task does not exist"
    
    task = translation_results[task_id]
    
    if task['status'] in ['completed', 'failed']:
        return False, f"Task is already {task['status']}, cannot stop"
    
    if task['status'] == 'processing':
        # Cannot immediately stop a running task, must wait for completion
        return False, "Task is running, cannot stop"
    
    # Update task status to failed
    translation_results[task_id]['status'] = 'failed'
    translation_results[task_id]['error'] = 'Task stopped by user'
    translation_results[task_id]['end_time'] = time.time()
    
    print(f"Translation task stopped: {task_id}")
    return True, "Task stopped"

def stop_all_translation_tasks():
    """Stop all translation tasks (simplified)"""
    stopped_count = 0
    for task_id, task in translation_results.items():
        if task['status'] in ['queued']:
            translation_results[task_id]['status'] = 'failed'
            translation_results[task_id]['error'] = 'Batch stop operation'
            translation_results[task_id]['end_time'] = time.time()
            stopped_count += 1
    
    print(f"Stopped {stopped_count} translation tasks")
    return stopped_count

def clear_stopped_tasks():
    """Clear records of stopped tasks"""
    # Remove records of stopped tasks
    to_remove = []
    for task_id, task in translation_results.items():
        if task['status'] in ['failed', 'completed']:
            to_remove.append(task_id)
    
    for task_id in to_remove:
        del translation_results[task_id]
    
    print(f"Cleared {len(to_remove)} task records")
