document.addEventListener('DOMContentLoaded', function() {
    const convertForm = document.getElementById('convertForm');
    const resultCard = document.getElementById('resultCard');
    const resultContent = document.getElementById('resultContent');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // 默认值
    const defaultScript = window.location.origin + '/example/script.js';
    const defaultTemplate = window.location.origin + '/example/template.yaml';
    
    // 表单提交处理
    convertForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const subUrl = document.getElementById('sub').value.trim();
        let scriptUrl = document.getElementById('script').value.trim();
        let templateUrl = document.getElementById('template').value.trim();
        const token = document.getElementById('token').value.trim();
        
        // 使用默认值（如果未提供）
        if (!scriptUrl) scriptUrl = defaultScript;
        if (!templateUrl) templateUrl = defaultTemplate;
        
        // 显示加载状态
        resultContent.textContent = '正在转换，请稍候...';
        resultCard.style.display = 'block';
        copyBtn.disabled = true;
        downloadBtn.disabled = true;
        
        // 构建请求URL
        const apiUrl = `/sub?sub=${encodeURIComponent(subUrl)}&script=${encodeURIComponent(scriptUrl)}&template=${encodeURIComponent(templateUrl)}&token=${encodeURIComponent(token)}`;
        
        // 发送请求
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`转换失败: ${text || response.statusText}`);
                    });
                }
                return response.text();
            })
            .then(data => {
                // 显示结果
                resultContent.textContent = data;
                copyBtn.disabled = false;
                downloadBtn.disabled = false;
            })
            .catch(error => {
                resultContent.textContent = error.message;
            });
    });
    
    // 复制结果
    copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(resultContent.textContent)
            .then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '已复制!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                alert('复制失败: ' + err);
            });
    });
    
    // 下载配置
    downloadBtn.addEventListener('click', function() {
        const blob = new Blob([resultContent.textContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'clash-config.yaml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});