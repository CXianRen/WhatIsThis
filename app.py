from flask import Flask, render_template, jsonify, send_from_directory
import os
import json

app = Flask(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
IMAGE_DIR = os.path.join(DATA_DIR, 'images')
RESULT_JSON = os.path.join(DATA_DIR, 'result.json')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def get_data():
    # 后端读取bbox数据，返回JSON给前端
    if not os.path.exists(RESULT_JSON):
        return jsonify({"error": "Data json file not found"}), 404
    with open(RESULT_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)
        # print("Loaded data:", data)
    return jsonify(data[0])

@app.route('/data/images/<filename>')
def get_image(filename):
    print("request file:", filename)
    return send_from_directory(IMAGE_DIR, filename)

if __name__ == '__main__':
    app.run(debug=True)
