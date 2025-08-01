"""
读入一个中文章节
拆分成N个句子 (句号拆分)
对每个句子执行 转换 获得 英文文本
"""

import os
import re
import json
import time
import requests
from typing import List, Dict

# API配置
API_KEY = "sk-F4Oe5MiaApayE1x4771f24E4E2C54e2dB82185589dAc427e"
API_URL = "https://free.v36.cm/v1/chat/completions"

# 基础配置
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, 'data', 'novel')


def read_chapter_file(file_path: str) -> str:
    """读取章节文件内容"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
        return content
    except FileNotFoundError:
        print(f"文件不存在: {file_path}")
        return ""
    except Exception as e:
        print(f"读取文件失败: {e}")
        return ""


def split_sentences(text: str) -> List[str]:
    """将文本按句号拆分成句子列表"""
    # 使用正则表达式按中文句号、问号、感叹号拆分
    sentences = re.split(r'[。！？]', text)
    
    # 过滤空字符串和只包含空白字符的句子
    sentences = [s.strip() for s in sentences if s.strip()]
    
    return sentences


def translate_sentence(sentence: str, retry_times: int = 3) -> str:
    """调用API将中文句子转换为英文"""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""将以下文本转换成[英文], 词汇难度[小学], 只返回转换后的文本:
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
            response = requests.post(API_URL, headers=headers, json=data, timeout=30)
            
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
            time.sleep(2)  # 重试前等待2秒
    
    return f"[翻译失败] {sentence}"


def process_chapter(chapter_path: str, output_path: str = None) -> Dict:
    """处理整个章节"""
    print(f"开始处理章节: {chapter_path}")
    
    # 读取章节内容
    content = read_chapter_file(chapter_path)
    if not content:
        return {"error": "无法读取章节内容"}
    
    # 拆分句子
    sentences = split_sentences(content)
    print(f"拆分得到 {len(sentences)} 个句子")
    
    # 翻译每个句子
    results = []
    for i, sentence in enumerate(sentences):
        print(f"正在翻译第 {i+1}/{len(sentences)} 个句子...")
        translated = translate_sentence(sentence)
        
        result = {
            "index": i + 1,
            "chinese": sentence,
            "english": translated
        }
        results.append(result)
        
        # 显示进度
        print(f"  中文: {sentence}")
        print(f"  英文: {translated}")
        print("-" * 50)
        
        # 避免请求过于频繁
        time.sleep(0.2)

    # 保存结果
    output_data = {
        "source_file": chapter_path,
        "total_sentences": len(sentences),
        "results": results,
        "processed_time": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    if output_path:
        try:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)
            print(f"结果已保存到: {output_path}")
        except Exception as e:
            print(f"保存文件失败: {e}")
    
    return output_data

process_chapter("data/novel/cultivation_of_commoner/chapter_1/zh.txt",
                "data/novel/cultivation_of_commoner/chapter_1/en.json")


