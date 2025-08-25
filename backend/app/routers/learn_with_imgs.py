from flask import Blueprint, jsonify, send_from_directory
from service.dictionary import *
from config.config import IMAGE_DIR

#### This service is not used now, need to be refactored later ####

# gen
lwi_bp = Blueprint('lwi', __name__)

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
