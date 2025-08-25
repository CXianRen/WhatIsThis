# ================= Configuration File =================
import os

# Base path configuration
BASE_DIR = os.path.dirname(__file__+"/../../../../")
BASE_DIR = os.path.abspath(BASE_DIR)
print(f"Base directory set to: {BASE_DIR}")

DATA_DIR = os.path.join(BASE_DIR, 'data')

TEMPLATE_PATH = os.path.join(BASE_DIR, 'frontend/templates')
STATIC_PATH = os.path.join(BASE_DIR, 'frontend/static')

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

# Ensure all directories exist
os.makedirs(GROUP_DIR, exist_ok=True)
os.makedirs(NOVEL_DIR, exist_ok=True)
os.makedirs(ANNOTATION_DIR, exist_ok=True)
os.makedirs(ANNOTATION_IMAGES_DIR, exist_ok=True)

# Translation API configuration
TRANSLATION_API_KEY = "sk-69431a48ab1842b7b3646e6241ecd69e"
TRANSLATION_API_URL = "https://api.deepseek.com/chat/completions"

# DeepSeek / LLM settings (you already set TRANSLATION_API_KEY/URL)
DEEPSEEK_MODEL = "deepseek-chat"  # or your preferred model name
CONVO_TEMPERATURE = 0.2

# CEFR ladder
CEFR_LEVELS = ["A1","A2","B1","B2","C1","C2"]
DEFAULT_CEFR = "A2"

# Supported languages configuration
SUPPORTED_LANGUAGES = {
    'en': {
        'name': 'English',
        'flag': '🇺🇸',
        # 'prompt': '将以下文本转换成[英文], 词汇难度[B1], 只返回转换后的文本'
        'prompt': 'convert the following text to [English], vocabulary difficulty [B1], return only the converted text'
    },
    'se': {
        'name': 'Swedish', 
        'flag': '🇸🇪',
        # 'prompt': '将以下文本转换成[瑞典语], 词汇难度[简单], 只返回转换后的文本'
        'prompt': 'convert the following text to [Swedish], vocabulary difficulty [simple], return only the converted text'
    },
    'fr': {
        'name': 'Franch',
        'flag': '🇫🇷', 
        # 'prompt': '将以下文本转换成[法语], 词汇难度[简单], 只返回转换后的文本'
        'prompt': 'convert the following text to [French], vocabulary difficulty [simple], return only the converted text'
    }
}
