# ================= 分组学习路由模块 =================
from flask import Blueprint, jsonify, request
import os
import json
from config import GROUP_DIR

# 创建蓝图
group_bp = Blueprint('group', __name__, url_prefix='/group')

# DAG管理
dag_map = {}  # {dag_name: dag_dict}

def load_all_dags():
    """加载所有DAG文件"""
    dag_map.clear()
    if not os.path.exists(GROUP_DIR):
        os.makedirs(GROUP_DIR, exist_ok=True)
        return
    
    for fname in os.listdir(GROUP_DIR):
        if fname.endswith('.json'):
            fpath = os.path.join(GROUP_DIR, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    dag = json.load(f)
                    dag_map[dag.get('name', fname[:-5])] = dag
            except Exception as e:
                print(f"Failed to load DAG {fname}: {e}")

def save_dag(dag):
    """保存DAG到文件"""
    name = dag.get('name')
    if not name:
        raise ValueError('DAG必须有name字段')
    fpath = os.path.join(GROUP_DIR, f'{name}.json')
    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(dag, f, ensure_ascii=False, indent=2)
    dag_map[name] = dag

def delete_dag(name):
    """删除DAG文件"""
    fpath = os.path.join(GROUP_DIR, f'{name}.json')
    if os.path.exists(fpath):
        os.remove(fpath)
    dag_map.pop(name, None)

# 初始化加载DAG
load_all_dags()

@group_bp.route('', methods=['GET'])
def get_dag_list():
    """获取所有DAG列表"""
    return jsonify(list(dag_map.values()))

@group_bp.route('/add', methods=['POST'])
def add_dag():
    """新增DAG"""
    dag = request.get_json()
    name = dag.get('name')
    if not name:
        return jsonify({'success': False, 'error': 'DAG必须有name字段'}), 400
    if name in dag_map:
        return jsonify({'success': False, 'error': 'DAG已存在'}), 400
    try:
        save_dag(dag)
        return jsonify({'success': True, 'dag': dag})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@group_bp.route('/update/<dag_name>', methods=['POST'])
def update_dag(dag_name):
    """更新DAG"""
    dag = request.get_json()
    if not dag.get('name'):
        return jsonify({'success': False, 'error': 'DAG必须有name字段'}), 400
    if dag_name != dag['name']:
        # 支持重命名，先删旧的
        delete_dag(dag_name)
    try:
        save_dag(dag)
        return jsonify({'success': True, 'dag': dag})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@group_bp.route('/delete/<dag_name>', methods=['POST'])
def delete_dag_api(dag_name):
    """删除DAG"""
    if dag_name not in dag_map:
        return jsonify({'success': False, 'error': 'DAG不存在'}), 404
    try:
        delete_dag(dag_name)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
