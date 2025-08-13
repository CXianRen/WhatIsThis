from flask import Blueprint, render_template, jsonify, send_from_directory, request
from service.dictionary import *
import json
import os
from config.config import RESULT_JSON, IMAGE_DIR

# 创建蓝图
lwi_bp = Blueprint('lwi', __name__)

# 图片文件服务
# get all scenarios
@lwi_bp.route('/list')
def list_images():
    return jsonify(list(name_id_map.keys()))

# get the image of a scenario
@lwi_bp.route('/data/<image_name>')
def get_data(image_name):
    return jsonify(raw_data[name_id_map[image_name]])

@lwi_bp.route('/data/images/<filename>')
def get_image(filename):
    return send_from_directory(IMAGE_DIR, filename)
