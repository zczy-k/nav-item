// 加载当前设置
function loadSettings() {
    chrome.storage.sync.get(['navUrl'], function(result) {
        if (result.navUrl) {
            document.getElementById('navUrl').value = result.navUrl;
            document.getElementById('currentUrlText').textContent = result.navUrl;
            document.getElementById('currentUrl').style.display = 'block';
        }
    });
}

// 显示消息
function showMessage(text, type = 'success') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

// 保存设置
document.getElementById('saveBtn').addEventListener('click', function() {
    const url = document.getElementById('navUrl').value.trim();
    
    if (!url) {
        showMessage('请输入导航站地址', 'error');
        return;
    }
    
    // 验证 URL
    try {
        const urlObj = new URL(url);
        if (!urlObj.protocol.startsWith('http')) {
            throw new Error('Invalid protocol');
        }
    } catch (e) {
        showMessage('请输入有效的 URL 地址（需包含 http:// 或 https://）', 'error');
        return;
    }
    
    // 保存到存储
    chrome.storage.sync.set({ navUrl: url }, function() {
        showMessage('设置已保存！');
        document.getElementById('currentUrlText').textContent = url;
        document.getElementById('currentUrl').style.display = 'block';
    });
});

// 重置设置
document.getElementById('resetBtn').addEventListener('click', function() {
    if (confirm('确定要重置设置吗？这将清除你保存的导航站地址。')) {
        chrome.storage.sync.remove('navUrl', function() {
            document.getElementById('navUrl').value = '';
            document.getElementById('currentUrl').style.display = 'none';
            showMessage('设置已重置');
        });
    }
});

// 页面加载时加载设置
document.addEventListener('DOMContentLoaded', loadSettings);
