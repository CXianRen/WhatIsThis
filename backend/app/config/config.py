# ================= 配置文件 =================
import os

# 基础路径配置
# BASE_DIR = os.path.dirname(__file__+"/../")
DATA_DIR = os.path.join("/home/g/WhatIsThis/", 'data')

TEMPLATE_PATH = os.path.join('/home/g/WhatIsThis/frontend', 'templates')
STATIC_PATH = os.path.join('/home/g/WhatIsThis/frontend', 'static')

IMAGE_DIR = os.path.join(DATA_DIR, 'images')
RESULT_JSON = os.path.join(DATA_DIR, 'result.json')
IMG_CACHE_DB = os.path.join(DATA_DIR, 'img_cache.db')
EN_PHONETIC_DB = os.path.join(DATA_DIR, 'en_phonetic.db')
EN_DB = os.path.join(DATA_DIR, 'en_dict.db')

GROUP_DIR = os.path.join(DATA_DIR, 'group')
NOVEL_DIR = os.path.join(DATA_DIR, 'novel')
ANNOTATION_DIR = os.path.join(DATA_DIR, 'annotations')
ANNOTATION_IMAGES_DIR = os.path.join(ANNOTATION_DIR, 'images')
ANNOTATION_DATA_FILE = os.path.join(ANNOTATION_DIR, 'annotations.json')

# 确保所有目录存在
os.makedirs(GROUP_DIR, exist_ok=True)
os.makedirs(NOVEL_DIR, exist_ok=True)
os.makedirs(ANNOTATION_DIR, exist_ok=True)
os.makedirs(ANNOTATION_IMAGES_DIR, exist_ok=True)

# 翻译API配置
TRANSLATION_API_KEY = "sk-69431a48ab1842b7b3646e6241ecd69e"
TRANSLATION_API_URL = "https://api.deepseek.com/chat/completions"

# 支持的语言配置
SUPPORTED_LANGUAGES = {
    'en': {
        'name': '英语',
        'flag': '🇺🇸',
        'prompt': '将以下文本转换成[英文], 词汇难度[B1], 只返回转换后的文本'
    },
    'se': {
        'name': '瑞典语', 
        'flag': '🇸🇪',
        'prompt': '将以下文本转换成[瑞典语], 词汇难度[简单], 只返回转换后的文本'
    },
    'fr': {
        'name': '法语',
        'flag': '🇫🇷', 
        'prompt': '将以下文本转换成[法语], 词汇难度[简单], 只返回转换后的文本'
    }
}
