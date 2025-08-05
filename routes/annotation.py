# ================= 标注模式路由模块 =================
from flask import Blueprint, jsonify, request, send_from_directory
import os
import json
import uuid
from werkzeug.utils import secure_filename
from config import ANNOTATION_DIR, ANNOTATION_IMAGES_DIR, ANNOTATION_DATA_FILE

# 创建蓝图
annotation_bp = Blueprint('annotation', __name__, url_prefix='/annotations')

def load_annotation_data():
    """加载标注数据"""
    if os.path.exists(ANNOTATION_DATA_FILE):
        with open(ANNOTATION_DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_annotation_data(data):
    """保存标注数据"""
    with open(ANNOTATION_DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@annotation_bp.route('', methods=['GET'])
def get_annotations():
    """获取所有标注项目列表"""
    return jsonify(load_annotation_data())

@annotation_bp.route('', methods=['POST'])
def add_annotation():
    """添加新的标注项目"""
    try:
        data = request.get_json()
        if not data or 'name' not in data:
            return jsonify({'error': '缺少必要的参数'}), 400
        
        annotations = load_annotation_data()
        
        # 检查名称是否已存在
        if any(ann['name'] == data['name'] for ann in annotations):
            return jsonify({'error': '项目名称已存在'}), 400
        
        new_annotation = {
            'id': len(annotations) + 1,
            'name': data['name'],
            'image_path': data.get('image_path', ''),
            'annotations': data.get('annotations', []),
            'created_at': data.get('created_at'),
            'updated_at': data.get('updated_at')
        }
        
        annotations.append(new_annotation)
        save_annotation_data(annotations)
        
        return jsonify({'success': True, 'data': new_annotation})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@annotation_bp.route('/<int:annotation_id>', methods=['GET'])
def get_annotation(annotation_id):
    """获取特定标注项目的详情"""
    annotations = load_annotation_data()
    annotation = next((ann for ann in annotations if ann['id'] == annotation_id), None)
    
    if not annotation:
        return jsonify({'error': '标注项目不存在'}), 404
    
    return jsonify(annotation)

@annotation_bp.route('/<int:annotation_id>', methods=['PUT'])
def update_annotation(annotation_id):
    """更新标注项目"""
    try:
        data = request.get_json()
        annotations = load_annotation_data()
        
        annotation_index = next((i for i, ann in enumerate(annotations) if ann['id'] == annotation_id), None)
        if annotation_index is None:
            return jsonify({'error': '标注项目不存在'}), 404
        
        # 更新数据
        annotations[annotation_index].update(data)
        annotations[annotation_index]['updated_at'] = data.get('updated_at')
        
        save_annotation_data(annotations)
        
        return jsonify({'success': True, 'data': annotations[annotation_index]})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@annotation_bp.route('/<int:annotation_id>', methods=['DELETE'])
def delete_annotation(annotation_id):
    """删除标注项目"""
    try:
        annotations = load_annotation_data()
        annotation_index = next((i for i, ann in enumerate(annotations) if ann['id'] == annotation_id), None)
        
        if annotation_index is None:
            return jsonify({'error': '标注项目不存在'}), 404
        
        # 删除图片文件
        removed_annotation = annotations.pop(annotation_index)
        if removed_annotation.get('image_path'):
            image_file_path = os.path.join(ANNOTATION_IMAGES_DIR, removed_annotation['image_path'])
            if os.path.exists(image_file_path):
                os.remove(image_file_path)
        
        save_annotation_data(annotations)
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@annotation_bp.route('/upload', methods=['POST'])
def upload_annotation_image():
    """上传标注图片"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': '没有上传图片'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        # 生成唯一文件名
        file_ext = os.path.splitext(secure_filename(file.filename))[1]
        filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(ANNOTATION_IMAGES_DIR, filename)
        
        file.save(file_path)
        
        return jsonify({'success': True, 'filename': filename})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@annotation_bp.route('/images/<filename>')
def serve_annotation_image(filename):
    """提供标注图片"""
    return send_from_directory(ANNOTATION_IMAGES_DIR, filename)
