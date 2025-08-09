# ================= 翻译服务模块 (简化版) =================
import re
import time
import json
import requests
import threading
from config import TRANSLATION_API_KEY, TRANSLATION_API_URL, SUPPORTED_LANGUAGES

# 简化的翻译管理
translation_results = {}  # 存储翻译结果和进度
current_task = None  # 当前正在处理的任务
processing_lock = threading.Lock()  # 确保只有一个任务在执行

def split_sentences(text: str) -> list:
    """将文本按句号拆分成句子列表"""
    sentences = re.split(r'[。！？]', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    return sentences

def translate_sentences_batch(sentences: list, target_language: str, retry_times: int = 3) -> list:
    """批量翻译句子，每次最多10个句子"""
    if target_language not in SUPPORTED_LANGUAGES:
        return [f"[不支持的语言] {sentence}" for sentence in sentences]
    
    headers = {
        "Authorization": f"Bearer {TRANSLATION_API_KEY}",
        "Content-Type": "application/json"
    }
    
    language_config = SUPPORTED_LANGUAGES[target_language]
    
    # 构建JSON格式的输入
    sentences_json = {
        "sentences": [{"id": i+1, "text": sentence} for i, sentence in enumerate(sentences)]
    }
    
    prompt = f"""{language_config['prompt']}。

请翻译以下JSON格式的句子列表，保持相同的JSON结构返回：

输入：
{json.dumps(sentences_json, ensure_ascii=False, indent=2)}

要求：
1. 返回相同的JSON结构
2. 保持id字段不变
3. 将text字段翻译为目标语言
4. 只返回JSON，不要其他说明文字"""
    
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
                    
                    # 尝试解析JSON响应
                    try:
                        # 清理可能的markdown代码块标记
                        if translated_content.startswith('```json'):
                            translated_content = translated_content.replace('```json', '').replace('```', '')
                        elif translated_content.startswith('```'):
                            translated_content = translated_content.replace('```', '', 1).replace('```', '')
                        
                        translated_content = translated_content.strip()
                        translated_json = json.loads(translated_content)
                        
                        if 'sentences' in translated_json:
                            # 按id排序并提取翻译文本
                            sorted_sentences = sorted(translated_json['sentences'], key=lambda x: x.get('id', 0))
                            return [item.get('text', f'[翻译失败] {sentences[i]}') for i, item in enumerate(sorted_sentences)]
                        else:
                            print(f"JSON结构错误: {translated_json}")
                            
                    except json.JSONDecodeError as e:
                        print(f"JSON解析失败: {e}")
                        print(f"原始响应: {translated_content}")
                        
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
            time.sleep(3)
    
    return [f"[翻译失败] {sentence}" for sentence in sentences]

def translate_chapter_content_with_progress(content: str, target_language: str, task_id: str = None) -> dict:
    """翻译整个章节内容（带进度跟踪的优化版）"""
    print(f"开始翻译章节到 {target_language}")
    
    sentences = split_sentences(content)
    print(f"拆分得到 {len(sentences)} 个句子")
    
    translated_sentences = []
    batch_size = 10
    total_batches = (len(sentences) + batch_size - 1) // batch_size
    
    # 按批次处理句子
    for i in range(0, len(sentences), batch_size):
        batch = sentences[i:i + batch_size]
        batch_num = i // batch_size + 1
        
        print(f"正在翻译第 {batch_num}/{total_batches} 批（{len(batch)} 个句子）...")
        
        # 更新进度（50% + 40% * 当前批次进度）
        if task_id and task_id in translation_results:
            progress = 50 + int(40 * batch_num / total_batches)
            translation_results[task_id]['progress'] = min(progress, 90)
        
        # 批量翻译
        translated_batch = translate_sentences_batch(batch, target_language)
        translated_sentences.extend(translated_batch)
        
        # 批次间稍作延迟
        if i + batch_size < len(sentences):
            time.sleep(1)
    
    # 创建一对一对照格式的内容
    bilingual_content = []
    for i, (original, translated) in enumerate(zip(sentences, translated_sentences)):
        bilingual_content.append({
            "id": i + 1,
            "src": original,
            "target": translated
        })
    
    print(f"翻译完成，共处理 {len(sentences)} 个句子，发送 {total_batches} 次API请求")
    
    return {
        'content': bilingual_content,
        'language': target_language,
        'total_sentences': len(sentences),
        'processed_time': time.strftime("%Y-%m-%d %H:%M:%S")
    }

def process_translation_task(task):
    """处理单个翻译任务（同步处理，不使用队列）"""
    from config import NOVEL_DIR
    from routes.novel import __parse_novel_raw_name
    import os
    import json
    
    task_id = task['task_id']
    
    try:
        # 更新任务状态
        translation_results[task_id]['status'] = 'processing'
        translation_results[task_id]['progress'] = 10
        translation_results[task_id]['start_time'] = time.time()
        
        novel_name = task['novel_name']
        chapter_id = task['chapter_id']  # 这是实际的 cid
        lang_code = task['lang_code']
        overwrite = task.get('overwrite', False)
        
        novel_dir = os.path.join(NOVEL_DIR, novel_name)
        
        # 使用 novel.py 中的解析函数查找章节文件
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
            raise Exception('章节不存在')
        
        # 检查目标语言文件是否已存在
        target_filename = f"{target_info['basename']}.{lang_code}.json"
        target_path = os.path.join(novel_dir, target_filename)
        
        if os.path.exists(target_path) and not overwrite:
            translation_results[task_id]['status'] = 'failed'
            translation_results[task_id]['error'] = f'{SUPPORTED_LANGUAGES[lang_code]["name"]}版本已存在'
            translation_results[task_id]['end_time'] = time.time()
            return
        
        # 更新进度
        translation_results[task_id]['progress'] = 20
        
        # 读取原始中文内容
        txt_path = os.path.join(novel_dir, target_file)
        with open(txt_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 使用解析出的标题
        title = target_info['title']
        
        # 尝试从已有的英文翻译文件获取更好的标题
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
        
        # 更新进度
        translation_results[task_id]['progress'] = 30
        
        # 翻译标题和内容
        print(f"开始翻译章节 {title} 到 {SUPPORTED_LANGUAGES[lang_code]['name']}")
        
        # 使用批量翻译处理标题
        translated_title = ''
        if title:
            title_result = translate_sentences_batch([title], lang_code)
            translated_title = title_result[0] if title_result else title
        
        translation_results[task_id]['progress'] = 50
        
        # 使用批量翻译处理章节内容
        translation_result = translate_chapter_content_with_progress(body_content, lang_code, task_id)
        
        translation_results[task_id]['progress'] = 90
        
        # 准备翻译数据（中英对照格式）
        translation_data = {
            'title': translated_title,
            'content': translation_result['content'],  # 已经是中英对照格式
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

def add_translation_task(task_id, novel_name, chapter_id, lang_code, overwrite=False):
    """添加翻译任务并立即执行（简化版）"""
    global current_task
    
    # 检查是否有任务正在进行
    with processing_lock:
        if current_task is not None:
            # 如果有任务正在进行，返回错误
            return None
        
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
        
        current_task = task_id
    
    # 在后台线程中执行翻译
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
    """停止翻译任务（简化版：只能标记为失败）"""
    if task_id not in translation_results:
        return False, "任务不存在"
    
    task = translation_results[task_id]
    
    if task['status'] in ['completed', 'failed']:
        return False, f"任务已经是{task['status']}状态，无法停止"
    
    if task['status'] == 'processing':
        # 正在执行的任务无法立即停止，只能等待完成
        return False, "任务正在执行中，无法停止"
    
    # 更新任务状态为失败
    translation_results[task_id]['status'] = 'failed'
    translation_results[task_id]['error'] = '任务已被用户停止'
    translation_results[task_id]['end_time'] = time.time()
    
    print(f"翻译任务已停止: {task_id}")
    return True, "任务已停止"

def stop_all_translation_tasks():
    """停止所有翻译任务（简化版）"""
    stopped_count = 0
    for task_id, task in translation_results.items():
        if task['status'] in ['queued']:
            translation_results[task_id]['status'] = 'failed'
            translation_results[task_id]['error'] = '批量停止操作'
            translation_results[task_id]['end_time'] = time.time()
            stopped_count += 1
    
    print(f"已停止 {stopped_count} 个翻译任务")
    return stopped_count

def clear_stopped_tasks():
    """清理已停止任务的记录"""
    # 移除已停止的任务记录
    to_remove = []
    for task_id, task in translation_results.items():
        if task['status'] in ['failed', 'completed']:
            to_remove.append(task_id)
    
    for task_id in to_remove:
        del translation_results[task_id]
    
    print(f"已清理 {len(to_remove)} 个任务记录")
