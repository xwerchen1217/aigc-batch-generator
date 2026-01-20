"""
Flask Web应用 - 交互式话题召回Key生成工具
"""

import os
import json
import uuid
from dataclasses import asdict
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

from api_clients import api_config
from generator import KeyGenerator, GenerationResult

app = Flask(__name__)
CORS(app)

# 配置
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'P')

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# 全局状态管理
class GlobalState:
    def __init__(self):
        self.generator = KeyGenerator(save_interval=20)
        self.prompt_template = ""
        self.variable_mapping = {}
        self.input_file = ""
        self.output_file = ""
        self.generation_status = "idle"  # idle, previewing, generating, completed, error
        self.status_message = ""
        self.task_id = ""

    def reset(self):
        """重置状态"""
        self.generator.clear()
        self.prompt_template = ""
        self.variable_mapping = {}
        self.generation_status = "idle"
        self.status_message = ""

state = GlobalState()


# 默认Prompt模板路径
DEFAULT_PROMPT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'P', 'topic_search_key')


def load_default_prompt():
    """加载默认Prompt模板"""
    if os.path.exists(DEFAULT_PROMPT_PATH):
        with open(DEFAULT_PROMPT_PATH, 'r', encoding='utf-8') as f:
            return f.read()
    return ""


# ==================== 路由 ====================

@app.route('/')
def index():
    """主页面"""
    return render_template('index.html')


@app.route('/api/config', methods=['POST'])
def configure_api():
    """配置API"""
    data = request.json
    api_url = data.get('api_url', '').strip()
    api_key = data.get('api_key', '').strip()
    model = data.get('model', '').strip()

    if not all([api_url, api_key, model]):
        return jsonify({
            'success': False,
            'message': '参数不完整，需要 api_url, api_key, model'
        })

    success, message = api_config.configure(api_url, api_key, model)

    return jsonify({
        'success': success,
        'message': message
    })


@app.route('/api/config/check', methods=['GET'])
def check_config():
    """检查API配置状态"""
    return jsonify({
        'success': True,
        'configured': api_config.is_configured()
    })


@app.route('/api/prompt/default', methods=['GET'])
def get_default_prompt():
    """获取默认Prompt模板"""
    prompt = load_default_prompt()
    return jsonify({
        'success': True,
        'data': {
            'prompt': prompt,
            'variables': [
                {'name': '主场景', 'column': '目标对象'},
                {'name': '子场景', 'column': '营销主题'},
                {'name': 'Tab词', 'column': 'Tab分类'}
            ]
        }
    })


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """上传xlsx文件"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': '没有文件'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': '文件名为空'})

    if not file.filename.endswith('.xlsx'):
        return jsonify({'success': False, 'message': '只支持.xlsx文件'})

    # 保存文件
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # 加载文件
    state.reset()
    success, message = state.generator.load_input(filepath)

    if not success:
        return jsonify({'success': False, 'message': message})

    state.input_file = filepath
    state.generation_status = "file_loaded"

    return jsonify({
        'success': True,
        'message': message,
        'data': {
            'total_rows': state.generator.total_rows,
            'headers': state.generator.headers,
            'preview': state.generator.get_data_preview(5)
        }
    })


@app.route('/api/preview', methods=['POST'])
def preview():
    """预览前N个生成结果"""
    if not api_config.is_configured():
        return jsonify({'success': False, 'message': '请先配置API'})

    data = request.json
    template = data.get('prompt', '')
    variables_raw = data.get('variables', [])
    n = data.get('count', 3)

    # 转换变量映射
    variables = {v['name']: v['column'] for v in variables_raw}

    state.prompt_template = template
    state.variable_mapping = variables
    state.generation_status = "previewing"

    try:
        results, message = state.generator.preview_first_n(
            api_config.get_client(),
            n=n,
            template=template,
            variables=variables
        )

        state.generation_status = "preview_completed"

        return jsonify({
            'success': True,
            'message': message,
            'data': {
                'results': [asdict(r) for r in results],
                'count': len(results)
            }
        })
    except Exception as e:
        state.generation_status = "error"
        state.status_message = str(e)
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/generate', methods=['POST'])
def start_generation():
    """开始批量生成"""
    if not api_config.is_configured():
        return jsonify({'success': False, 'message': '请先配置API'})

    if state.generator.total_rows == 0:
        return jsonify({'success': False, 'message': '请先上传文件'})

    data = request.json
    start_index = data.get('start_index', 0)
    max_workers = data.get('max_workers', 5)  # 并发数，默认5

    def progress_callback(current, total, success_count, error_count):
        # 进度更新会通过 /api/progress 获取
        pass

    state.generation_status = "generating"

    def run_generation():
        try:
            success, message = state.generator.start_generation(
                api_config.get_client(),
                state.prompt_template,
                state.variable_mapping,
                start_index=start_index,
                on_progress=progress_callback,
                max_workers=max_workers  # 传递并发参数
            )

            if success:
                state.generation_status = "completed"
                state.status_message = message
            else:
                state.generation_status = "error"
                state.status_message = message

        except Exception as e:
            state.generation_status = "error"
            state.status_message = str(e)

    # 在后台运行
    import threading
    thread = threading.Thread(target=run_generation)
    thread.start()

    return jsonify({
        'success': True,
        'message': '生成任务已启动',
        'data': {
            'total': state.generator.total_rows,
            'start_index': start_index,
            'max_workers': max_workers
        }
    })


@app.route('/api/progress', methods=['GET'])
def get_progress():
    """获取生成进度"""
    progress = state.generator.get_progress()

    return jsonify({
        'success': True,
        'data': {
            **progress,
            'status': state.generation_status,
            'message': state.status_message
        }
    })


@app.route('/api/checkpoint/list', methods=['GET'])
def list_checkpoints():
    """列出可用的断点文件"""
    checkpoint = state.generator.get_latest_checkpoint()

    if checkpoint:
        return jsonify({
            'success': True,
            'data': {
                'has_checkpoint': True,
                'checkpoint_path': checkpoint,
                'filename': os.path.basename(checkpoint)
            }
        })
    else:
        return jsonify({
            'success': True,
            'data': {
                'has_checkpoint': False,
                'checkpoint_path': None
            }
        })


@app.route('/api/checkpoint/load', methods=['POST'])
def load_checkpoint():
    """加载断点"""
    data = request.json
    checkpoint_path = data.get('checkpoint_path')

    if not checkpoint_path:
        # 自动查找最新断点
        checkpoint_path = state.generator.get_latest_checkpoint()

    if not checkpoint_path:
        return jsonify({'success': False, 'message': '没有找到断点文件'})

    success, message = state.generator.load_checkpoint(checkpoint_path)

    if success:
        # 恢复状态
        last_checkpoint = state.generator._last_checkpoint
        if last_checkpoint:
            with open(last_checkpoint, 'r', encoding='utf-8') as f:
                checkpoint_data = json.load(f)
                state.prompt_template = checkpoint_data.get('prompt_template', '')
                state.variable_mapping = checkpoint_data.get('variable_mapping', {})

        state.generation_status = "checkpoint_loaded"

    return jsonify({
        'success': success,
        'message': message,
        'data': {
            'progress': state.generator.get_progress() if success else None
        }
    })


@app.route('/api/export', methods=['POST'])
def export_result():
    """导出结果"""
    if not state.generator.results:
        return jsonify({'success': False, 'message': '没有可导出的结果'})

    data = request.json
    filename = data.get('filename', '话题keygen_result.xlsx')

    output_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    success, message = state.generator.export_result(output_path, state.input_file)

    if success:
        state.output_file = output_path

    return jsonify({
        'success': success,
        'message': message,
        'data': {
            'filename': filename
        } if success else None
    })


@app.route('/api/download', methods=['GET'])
def download_result():
    """下载结果文件"""
    if not state.output_file or not os.path.exists(state.output_file):
        return jsonify({'success': False, 'message': '结果文件不存在'})

    return send_file(
        state.output_file,
        as_attachment=True,
        download_name=os.path.basename(state.output_file),
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )


@app.route('/api/reset', methods=['POST'])
def reset_state():
    """重置状态"""
    state.reset()
    return jsonify({
        'success': True,
        'message': '状态已重置'
    })


if __name__ == '__main__':
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    print("=" * 50)
    print("交互式话题召回Key生成工具")
    print(f"访问地址: http://localhost:{port}")
    print("=" * 50)
    app.run(host='127.0.0.1', port=port, debug=True)
