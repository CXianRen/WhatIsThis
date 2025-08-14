# ================= Basic Route Module =================
from flask import Blueprint, render_template, jsonify, send_from_directory
from service.dictionary import *
import os

# Create blueprint
app_bp = Blueprint('app', __name__)


# Home navigation
@app_bp.route('/')
def nav():
    return render_template('nav.html')

# Unified route for multiple app pages
@app_bp.route('/<page_name>')
def render_app_page(page_name):
    page_templates = {
        # app name : template file
        'lwi': 'LWI.html',
        'lwg': 'LWG.html',
        'novel-reader': 'NovelReader.html',
        'annotation': 'Annotation.html',
        'novel-upload': 'NovelUpload.html',
        'novel-translation': 'NovelTranslation.html',
        'word-cards': 'WordCards.html'
    }
    template = page_templates.get(page_name)
    if template:
        return render_template(template)
    else:
        return jsonify({"error": "Page not found"}), 404

# Site manifest
@app_bp.route('/site.webmanifest')
def site_webmanifest():
    return send_from_directory('static', 'site.webmanifest')

# Service Worker
@app_bp.route('/sw.js')
def service_worker():
    response = send_from_directory('static', 'sw.js')
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Service-Worker-Allowed'] = '/'
    return response

# to be removed
@app_bp.route('/components/word_detail_panel')
def get_word_detail_panel():
    """Return the word detail panel component HTML."""
    return render_template('word_detail_panel.html')

# to be removed
@app_bp.route('/components/<component_name>')
def get_component(component_name):
    """Return the specified component HTML."""
    component_path = os.path.join('components', component_name)
    if os.path.exists(component_path):
        return render_template(component_path)
    else:
        return jsonify({"error": "Component not found"}), 404
