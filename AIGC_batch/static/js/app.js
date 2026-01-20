/**
 * 交互式话题召回Key生成工具 - 前端逻辑
 */

// ==================== 状态管理 ====================
const state = {
    apiConfigured: false,
    fileLoaded: false,
    previewCompleted: false,
    generationCompleted: false,
    progressInterval: null,
    totalRows: 0,
    promptTemplate: '',
    variables: [
        { name: '主场景', column: '目标对象' },
        { name: '子场景', column: '营销主题' },
        { name: 'Tab词', column: 'Tab分类' }
    ]
};

// ==================== API 请求封装 ====================
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    return data;
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
    renderVariableMapping();
    setupEventListeners();
    checkCheckpoint();
});

// ==================== API配置 ====================
document.getElementById('btn-save-api').addEventListener('click', async () => {
    const apiUrl = document.getElementById('api-url').value.trim();
    const apiKey = document.getElementById('api-key').value.trim();
    const model = document.getElementById('api-model').value.trim();

    if (!apiUrl || !apiKey || !model) {
        showStatus('api-status', '请填写完整的API配置', 'error');
        return;
    }

    const response = await apiRequest('/api/config', {
        method: 'POST',
        body: JSON.stringify({ api_url: apiUrl, api_key: apiKey, model })
    });

    if (response.success) {
        state.apiConfigured = true;
        showStatus('api-status', 'API配置成功！', 'success');
        updateButtons();
    } else {
        showStatus('api-status', '配置失败: ' + response.message, 'error');
    }
});

// ==================== Prompt配置 ====================
document.getElementById('btn-load-default-prompt').addEventListener('click', async () => {
    const response = await apiRequest('/api/prompt/default');
    if (response.success) {
        document.getElementById('prompt-template').value = response.data.prompt;
        state.variables = response.data.variables || state.variables;
        renderVariableMapping();
    }
});

function renderVariableMapping() {
    const container = document.getElementById('variable-mapping');
    container.innerHTML = '';

    state.variables.forEach((variable, index) => {
        const item = document.createElement('div');
        item.className = 'variable-item';
        item.innerHTML = `
            <input type="text" value="${variable.name}" placeholder="变量名" data-index="${index}" data-field="name">
            <span>→</span>
            <input type="text" value="${variable.column}" placeholder="列名" data-index="${index}" data-field="column">
            <button class="btn-remove" onclick="removeVariable(${index})">✕</button>
        `;
        container.appendChild(item);
    });
}

document.getElementById('btn-add-variable').addEventListener('click', () => {
    state.variables.push({ name: '', column: '' });
    renderVariableMapping();
});

function removeVariable(index) {
    state.variables.splice(index, 1);
    renderVariableMapping();
}

// 监听变量变化
document.getElementById('variable-mapping').addEventListener('input', (e) => {
    if (e.target.dataset.index !== undefined) {
        const index = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        state.variables[index][field] = e.target.value;
    }
});

// ==================== 文件上传 ====================
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');

uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.xlsx')) {
        handleFileUpload(file);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

async function handleFileUpload(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    const data = await response.json();

    if (data.success) {
        state.fileLoaded = true;
        state.totalRows = data.data.total_rows;

        // 显示文件信息
        showFileInfo(data.data);
        updateButtons();
    } else {
        alert('上传失败: ' + data.message);
    }
}

function showFileInfo(data) {
    const fileInfo = document.getElementById('file-info');
    const previewTable = document.getElementById('data-preview');

    // 表头
    const thead = previewTable.querySelector('thead');
    thead.innerHTML = '<tr>' + data.headers.map(h => `<th>${h}</th>`).join('') + '</tr>';

    // 表体（前5行）
    const tbody = previewTable.querySelector('tbody');
    tbody.innerHTML = data.preview.map(row =>
        '<tr>' + data.headers.map(h => `<td>${row[h] || ''}</td>`).join('') + '</tr>'
    ).join('');

    fileInfo.style.display = 'block';
    uploadZone.style.display = 'none';
}

// ==================== 预览 ====================
document.getElementById('btn-preview').addEventListener('click', async () => {
    const template = document.getElementById('prompt-template').value;

    if (!template) {
        alert('请先配置Prompt模板');
        return;
    }

    const response = await apiRequest('/api/preview', {
        method: 'POST',
        body: JSON.stringify({
            prompt: template,
            variables: state.variables,
            count: 3
        })
    });

    if (response.success) {
        state.previewCompleted = true;
        state.promptTemplate = template;
        showPreviewResults(response.data.results);
        updateButtons();
    } else {
        alert('预览失败: ' + response.message);
    }
});

function showPreviewResults(results) {
    const container = document.getElementById('preview-results');
    const list = document.getElementById('preview-list');

    list.innerHTML = results.map(r => `
        <div class="preview-item">
            <div class="preview-header">
                <strong>第 ${r.row_index + 1} 行</strong>
                <span class="${r.success ? 'success-count' : 'error-count'}">
                    ${r.success ? '✓ 成功' : '✗ 失败'}
                </span>
            </div>
            <div class="preview-input">
                ${Object.entries(r.input_data).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join('')}
            </div>
            <div class="preview-result ${r.success ? '' : 'error'}">
                ${r.success ? r.result : r.error}
            </div>
        </div>
    `).join('');

    container.style.display = 'block';
}

// ==================== 批量生成 ====================
document.getElementById('btn-start-generate').addEventListener('click', async () => {
    const maxWorkers = parseInt(document.getElementById('max-workers').value) || 5;
    const response = await apiRequest('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ start_index: 0, max_workers: maxWorkers })
    });

    if (response.success) {
        document.getElementById('progress-container').style.display = 'block';
        document.getElementById('btn-start-generate').style.display = 'none';
        startProgressPolling();
    } else {
        alert('启动失败: ' + response.message);
    }
});

function startProgressPolling() {
    state.progressInterval = setInterval(async () => {
        const response = await apiRequest('/api/progress');
        if (response.success) {
            updateProgress(response.data);

            if (response.data.status === 'completed' || response.data.status === 'error') {
                clearInterval(state.progressInterval);
                state.generationCompleted = true;
                updateButtons();
            }
        }
    }, 1000);
}

function updateProgress(data) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressPercent = document.getElementById('progress-percent');
    const successCount = document.getElementById('success-count');
    const errorCount = document.getElementById('error-count');

    progressBar.style.width = data.progress + '%';
    progressBar.textContent = Math.round(data.progress) + '%';
    progressText.textContent = `${data.current} / ${data.total}`;
    progressPercent.textContent = Math.round(data.progress) + '%';
    successCount.textContent = data.success;
    errorCount.textContent = data.error;
    
    // 更新生成耗时信息
    if (data.total_generation_time !== undefined && data.avg_generation_time !== undefined) {
        const progressLog = document.getElementById('progress-log');
        const timeInfo = document.createElement('div');
        timeInfo.className = 'time-info';
        timeInfo.innerHTML = `
            <span>总生成耗时: ${data.total_generation_time.toFixed(2)}秒</span>
            <span>平均耗时: ${data.avg_generation_time.toFixed(2)}秒/条</span>
        `;
        
        // 移除旧的时间信息
        const oldTimeInfo = progressLog.querySelector('.time-info');
        if (oldTimeInfo) {
            oldTimeInfo.remove();
        }
        
        // 添加新的时间信息
        progressLog.appendChild(timeInfo);
    }
}

// ==================== 导出下载 ====================
document.getElementById('btn-export').addEventListener('click', async () => {
    const response = await apiRequest('/api/export', {
        method: 'POST',
        body: JSON.stringify({ filename: '话题keygen_result.xlsx' })
    });

    if (response.success) {
        document.getElementById('btn-download').style.display = 'inline-flex';
        showStatus('progress-log', '导出成功！可以下载结果文件了。', 'success');
    } else {
        alert('导出失败: ' + response.message);
    }
});

document.getElementById('btn-download').addEventListener('click', () => {
    window.location.href = '/api/download';
});

document.getElementById('btn-reset').addEventListener('click', async () => {
    if (confirm('确定要重置所有状态吗？')) {
        await apiRequest('/api/reset', { method: 'POST' });
        location.reload();
    }
});

// ==================== 断点续传 ====================
async function checkCheckpoint() {
    const response = await apiRequest('/api/checkpoint/list');
    if (response.success && response.data.has_checkpoint) {
        document.getElementById('checkpoint-info').style.display = 'block';
    }
}

document.getElementById('btn-resume').addEventListener('click', async () => {
    const response = await apiRequest('/api/checkpoint/load', { method: 'POST' });

    if (response.success) {
        alert('断点已加载，可以继续生成');
        // 更新状态
        state.fileLoaded = true;
        state.apiConfigured = true;
        state.promptTemplate = response.data.prompt_template || '';
        state.variables = response.data.variable_mapping || state.variables;

        document.getElementById('prompt-template').value = state.promptTemplate;
        renderVariableMapping();
        updateButtons();
    } else {
        alert('加载断点失败: ' + response.message);
    }
});

// ==================== 工具函数 ====================
function showStatus(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = 'status-message show ' + type;
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

function updateButtons() {
    document.getElementById('btn-preview').disabled = !state.apiConfigured || !state.fileLoaded;
    document.getElementById('btn-start-generate').disabled = !state.previewCompleted;
    document.getElementById('btn-export').disabled = !state.generationCompleted;
}

function setupEventListeners() {
    // Prompt变化时需要重新预览
    document.getElementById('prompt-template').addEventListener('input', () => {
        state.previewCompleted = false;
        document.getElementById('preview-results').style.display = 'none';
        updateButtons();
    });
}
