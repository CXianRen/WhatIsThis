# ================= 翻译服务模块 =================
import re
import time
import requests
import threading
from queue import Queue
from config import TRANSLATION_API_KEY, TRANSLATION_API_URL, SUPPORTED_LANGUAGES

# 翻译队列管理
translation_queue = Queue()
translation_results = {}  # 存储翻译结果和进度
translation_thread = None
queue_processing = False
stopped_tasks = set()  # 存储被停止的任务ID

def split_sentences(text: str) -> list:
    """将文本按句号拆分成句子列表"""
    sentences = re.split(r'[。！？]', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    return sentences

def translate_sentence(sentence: str, target_language: str, retry_times: int = 3) -> str:
    """调用API将句子转换为目标语言"""
    if target_language not in SUPPORTED_LANGUAGES:
        return f"[不支持的语言] {sentence}"
    
    headers = {
        "Authorization": f"Bearer {TRANSLATION_API_KEY}",
        "Content-Type": "application/json"
    }
    
    language_config = SUPPORTED_LANGUAGES[target_language]
    prompt = f"""{language_config['prompt']}:
###
{sentence}
###"""
    
    data = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 500,
        "temperature": 0.3
    }
    
    for attempt in range(retry_times):
        try:
            response = requests.post(TRANSLATION_API_URL, headers=headers, json=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if 'choices' in result and len(result['choices']) > 0:
                    translated_text = result['choices'][0]['message']['content'].strip()
                    return translated_text
                else:
                    print(f"API响应格式错误: {result}")
            else:
                print(f"API请求失败，状态码: {response.status_code}")
                print(f"响应内容: {response.text}")
                
        except requests.exceptions.Timeout:
            print(f"请求超时，第 {attempt + 1} 次重试...")
        except requests.exceptions.RequestException as e:
            print(f"请求异常: {e}")
        except Exception as e:
            print(f"未知错误: {e}")
        
        if attempt < retry_times - 1:
            time.sleep(2)
    
    return f"[翻译失败] {sentence}"

def translate_chapter_content(content: str, target_language: str) -> dict:
    """翻译整个章节内容"""
    print(f"开始翻译章节到 {target_language}")
    
    sentences = split_sentences(content)
    print(f"拆分得到 {len(sentences)} 个句子")
    
    translated_sentences = []
    for i, sentence in enumerate(sentences):
        print(f"正在翻译第 {i+1}/{len(sentences)} 个句子...")
        translated = translate_sentence(sentence, target_language)
        translated_sentences.append(translated)
        time.sleep(0.2)
    
    translated_content = '。'.join(translated_sentences) + '。' if translated_sentences else ''
    
    return {
        'content': translated_content,
        'language': target_language,
        'total_sentences': len(sentences),
        'processed_time': time.strftime("%Y-%m-%d %H:%M:%S")
    }

def process_translation_queue():
    """处理翻译队列的后台线程"""
    global queue_processing
    queue_processing = True
    
    while queue_processing:
        try:
            if not translation_queue.empty():
                task = translation_queue.get(timeout=1)
                process_translation_task(task)
            else:
                time.sleep(0.5)
        except Exception as e:
            print(f"队列处理错误: {e}")
            time.sleep(1)

def process_translation_task(task):
    """处理单个翻译任务"""
    from config import NOVEL_DIR
    import os
    import json
    
    task_id = task['task_id']
    
    try:
        # 检查任务是否被停止
        if task_id in stopped_tasks:
            translation_results[task_id]['status'] = 'stopped'
            translation_results[task_id]['error'] = '任务已被停止'
            translation_results[task_id]['end_time'] = time.time()
            return
        
        # 更新任务状态
        translation_results[task_id]['status'] = 'processing'
        translation_results[task_id]['progress'] = 10
        translation_results[task_id]['start_time'] = time.time()
        
        novel_name = task['novel_name']
        chapter_id = task['chapter_id']
        lang_code = task['lang_code']
        overwrite = task.get('overwrite', False)
        
        novel_dir = os.path.join(NOVEL_DIR, novel_name)
        
        # 找到对应的txt文件
        txt_files = sorted([f for f in os.listdir(novel_dir) if f.endswith('.txt')])
        if chapter_id <= 0 or chapter_id > len(txt_files):
            raise Exception('章节不存在')
        
        # 检查目标语言文件是否已存在
        txt_filename = txt_files[chapter_id - 1]
        base_name = os.path.splitext(txt_filename)[0]
        target_filename = f"{base_name}.{lang_code}.json"
        target_path = os.path.join(novel_dir, target_filename)
        
        if os.path.exists(target_path) and not overwrite:
            translation_results[task_id]['status'] = 'failed'
            translation_results[task_id]['error'] = f'{SUPPORTED_LANGUAGES[lang_code]["name"]}版本已存在'
            translation_results[task_id]['end_time'] = time.time()
            return
        
        # 检查任务是否被停止
        if task_id in stopped_tasks:
            translation_results[task_id]['status'] = 'stopped'
            translation_results[task_id]['error'] = '任务已被停止'
            translation_results[task_id]['end_time'] = time.time()
            return
        
        # 更新进度
        translation_results[task_id]['progress'] = 20
        
        # 读取原始中文内容
        txt_path = os.path.join(novel_dir, txt_files[chapter_id - 1])
        with open(txt_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 解析标题和内容
        lines = content.strip().split('\n')
        title = lines[0].strip() if lines else ''
        body_content = '\n'.join(lines[1:]).strip() if len(lines) > 1 else content
        
        # 检查任务是否被停止
        if task_id in stopped_tasks:
            translation_results[task_id]['status'] = 'stopped'
            translation_results[task_id]['error'] = '任务已被停止'
            translation_results[task_id]['end_time'] = time.time()
            return
        
        # 更新进度
        translation_results[task_id]['progress'] = 30
        
        # 翻译标题和内容
        print(f"开始翻译章节 {title} 到 {SUPPORTED_LANGUAGES[lang_code]['name']}")
        
        translated_title = translate_sentence(title, lang_code) if title else ''
        
        # 检查任务是否被停止
        if task_id in stopped_tasks:
            translation_results[task_id]['status'] = 'stopped'
            translation_results[task_id]['error'] = '任务已被停止'
            translation_results[task_id]['end_time'] = time.time()
            return
        
        translation_results[task_id]['progress'] = 50
        
        translation_result = translate_chapter_content(body_content, lang_code)
        
        # 检查任务是否被停止
        if task_id in stopped_tasks:
            translation_results[task_id]['status'] = 'stopped'
            translation_results[task_id]['error'] = '任务已被停止'
            translation_results[task_id]['end_time'] = time.time()
            return
        
        translation_results[task_id]['progress'] = 90
        
        # 准备翻译数据
        translation_data = {
            'title': translated_title,
            'content': translation_result['content'],
            'original_title': title,
            'language': lang_code,
            'language_name': SUPPORTED_LANGUAGES[lang_code]['name'],
            'total_sentences': translation_result['total_sentences'],
            'translated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'processed_time': translation_result['processed_time']
        }
        
        # 保存翻译结果到JSON文件
        with open(target_path, 'w', encoding='utf-8') as f:
            json.dump(translation_data, f, ensure_ascii=False, indent=2)
        
        # 更新任务完成状态
        translation_results[task_id]['status'] = 'completed'
        translation_results[task_id]['progress'] = 100
        translation_results[task_id]['end_time'] = time.time()
        translation_results[task_id]['result'] = translation_data
        translation_results[task_id]['filename'] = target_filename
        
        print(f"翻译完成并保存到: {target_path}")
        
    except Exception as e:
        print(f"翻译任务失败: {e}")
        translation_results[task_id]['status'] = 'failed'
        translation_results[task_id]['error'] = str(e)
        translation_results[task_id]['end_time'] = time.time()

def start_translation_worker():
    """启动翻译工作线程"""
    global translation_thread
    if translation_thread is None or not translation_thread.is_alive():
        translation_thread = threading.Thread(target=process_translation_queue, daemon=True)
        translation_thread.start()
        print("翻译工作线程已启动")

def add_translation_task(task_id, novel_name, chapter_id, lang_code, overwrite=False):
    """添加翻译任务到队列"""
    # 初始化任务状态
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
    
    # 创建翻译任务
    task = {
        'task_id': task_id,
        'novel_name': novel_name,
        'chapter_id': chapter_id,
        'lang_code': lang_code,
        'overwrite': overwrite
    }
    
    # 添加任务到队列
    translation_queue.put(task)
    
    # 确保工作线程在运行
    start_translation_worker()
    
    return task_id

def get_translation_status(task_id):
    """获取翻译任务状态"""
    if task_id not in translation_results:
        return None
    
    task = translation_results[task_id]
    
    # 计算预计时间
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
    
    # 如果任务完成，包含结果信息
    if task['status'] == 'completed':
        result['result'] = {
            'filename': task['filename'],
            'language_name': SUPPORTED_LANGUAGES[task['lang_code']]['name']
        }
    
    return result

def stop_translation_task(task_id):
    """停止翻译任务"""
    global stopped_tasks
    
    if task_id not in translation_results:
        return False, "任务不存在"
    
    task = translation_results[task_id]
    
    if task['status'] in ['completed', 'failed', 'stopped']:
        return False, f"任务已经是{task['status']}状态，无法停止"
    
    # 添加到停止任务集合
    stopped_tasks.add(task_id)
    
    # 立即更新任务状态
    translation_results[task_id]['status'] = 'stopped'
    translation_results[task_id]['error'] = '任务已被用户停止'
    translation_results[task_id]['end_time'] = time.time()
    
    print(f"翻译任务已停止: {task_id}")
    return True, "任务已停止"

def stop_all_translation_tasks():
    """停止所有翻译任务"""
    global stopped_tasks
    
    stopped_count = 0
    for task_id, task in translation_results.items():
        if task['status'] in ['queued', 'processing']:
            stopped_tasks.add(task_id)
            translation_results[task_id]['status'] = 'stopped'
            translation_results[task_id]['error'] = '批量停止操作'
            translation_results[task_id]['end_time'] = time.time()
            stopped_count += 1
    
    print(f"已停止 {stopped_count} 个翻译任务")
    return stopped_count

def clear_stopped_tasks():
    """清理已停止任务的记录"""
    global stopped_tasks
    stopped_tasks.clear()
    
    # 移除已停止的任务记录
    to_remove = []
    for task_id, task in translation_results.items():
        if task['status'] == 'stopped':
            to_remove.append(task_id)
    
    for task_id in to_remove:
        del translation_results[task_id]
    
    print(f"已清理 {len(to_remove)} 个已停止的任务记录")
