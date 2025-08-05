# ================= 配置文件 =================
import os

# 基础路径配置
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, 'data')
IMAGE_DIR = os.path.join(DATA_DIR, 'images')
RESULT_JSON = os.path.join(DATA_DIR, 'result.json')
IMG_CACHE_DB = os.path.join(DATA_DIR, 'img_cache.db')
EN_PHONETIC_DB = os.path.join(DATA_DIR, 'en_phonetic.db')
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
TRANSLATION_API_KEY = "sk-F4Oe5MiaApayE1x4771f24E4E2C54e2dB82185589dAc427e"
TRANSLATION_API_URL = "https://free.v36.cm/v1/chat/completions"

# 支持的语言配置
SUPPORTED_LANGUAGES = {
    'en': {
        'name': '英语',
        'flag': '🇺🇸',
        'prompt': '将以下文本转换成[英文], 词汇难度[小学], 只返回转换后的文本'
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
