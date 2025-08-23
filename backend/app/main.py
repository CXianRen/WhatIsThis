# ================= Main Application Entry =================
from flask import Flask
import json
import os

# Import config and database modules
from config import config
from models.database import init_db
from models.tag.tag import init_tags

# Import all route blueprints
from routers.app import app_bp
from routers.group import group_bp
from routers.novel import book_bp
from routers.translation import translation_bp
from routers.annotation import annotation_bp
from routers.vocb import vocb_bp
from routers.user import user_bp
import sys

def create_app():
    """Application factory function"""
    app = Flask(__name__, 
                template_folder=config.TEMPLATE_PATH, 
                static_folder=config.STATIC_PATH)
    
    # Set MIME type
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000  # 1 year cache
    
    # Initialize database and cache
    init_tags()
    init_db()
     
    # Register blueprints
    app.register_blueprint(app_bp)
    app.register_blueprint(group_bp)
    app.register_blueprint(book_bp)
    app.register_blueprint(translation_bp)
    app.register_blueprint(annotation_bp)
    app.register_blueprint(vocb_bp)
    app.register_blueprint(user_bp)
    
    # Set static file MIME type
    @app.after_request
    def after_request(response):
        # Set correct MIME type for Service Worker
        if response.headers.get('Content-Type') == 'text/html; charset=utf-8' and '/sw.js' in str(response.location or ''):
            response.headers['Content-Type'] = 'application/javascript'
        
        # Set security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        return response
    
    return app

# Create app instance
app = create_app()

# Print startup info
print("=" * 60)
print("🚀 WhatIsThis Application Started")
print("=" * 60)
print("📁 Data Directory:", config.DATA_DIR)
print("📚 Novel Directory:", config.NOVEL_DIR)
print("🖼️  Image Directory:", config.IMAGE_DIR)
print("📝 Annotation Directory:", config.ANNOTATION_DIR)
print("=" * 60)

# Load base data
# try:
#     with open(config.RESULT_JSON, 'r', encoding='utf-8') as f:
#         raw_data = json.load(f)
#     print(f"✅ Successfully loaded {len(raw_data)} image data entries")
# except Exception as e:
#     print(f"❌ Failed to load data: {e}")


if __name__ == '__main__':

    port = 5000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port '{sys.argv[1]}', using default port 5000.")

    app.run(host='0.0.0.0', port=port, debug=True)
