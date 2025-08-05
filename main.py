# ================= 新的主应用入口 =================
from flask import Flask
import json
import os

# 导入配置和数据库模块
import config
from database import init_db, load_img_cache, load_phonetic_cache

# 导入所有路由蓝图
from routes.main import main_bp
from routes.group import group_bp
from routes.novel import novel_bp
from routes.novel_api import novel_api_bp
from routes.translation import translation_bp
from routes.annotation import annotation_bp

def create_app():
    """应用工厂函数"""
    app = Flask(__name__)
    
    # 初始化数据库和缓存
    init_db()
    load_img_cache()
    load_phonetic_cache()
    
    # 注册蓝图
    app.register_blueprint(main_bp)
    app.register_blueprint(group_bp)
    app.register_blueprint(novel_bp)
    app.register_blueprint(novel_api_bp)
    app.register_blueprint(translation_bp)
    app.register_blueprint(annotation_bp)
    
    return app

# 创建应用实例
app = create_app()

# 打印启动信息
print("=" * 60)
print("🚀 WhatIsThis 应用启动")
print("=" * 60)
print("📁 数据目录:", config.DATA_DIR)
print("📚 小说目录:", config.NOVEL_DIR)
print("🖼️  图片目录:", config.IMAGE_DIR)
print("📝 标注目录:", config.ANNOTATION_DIR)
print("=" * 60)

# 加载基础数据
try:
    with open(config.RESULT_JSON, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
    print(f"✅ 成功加载 {len(raw_data)} 条图片数据")
except Exception as e:
    print(f"❌ 加载数据失败: {e}")

print("=" * 60)
print("🌐 可用路由:")
print("  📖 章节管理: /novel-upload")
print("  🌍 语言转换: /novel-translation") 
print("  📚 小说阅读: /app3")
print("  🖼️  看图识词: /app1")
print("  📚 分组学习: /app2")
print("  📝 标注模式: /app4")
print("=" * 60)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
