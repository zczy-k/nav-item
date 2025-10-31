// 检查是否已保存导航站地址（同步执行，避免闪烁）
chrome.storage.sync.get(['navUrl'], function(result) {
    if (result.navUrl) {
        // 已配置，直接跳转
        window.location.replace(result.navUrl);
    } else {
        // 未配置，显示欢迎页面
        document.body.style.display = 'block';
    }
});

// 保存按钮点击事件
document.getElementById('saveBtn').addEventListener('click', function() {
    const urlInput = document.getElementById('navUrl');
    const errorDiv = document.getElementById('error');
    const loadingDiv = document.getElementById('loading');
    const url = urlInput.value.trim();
    
    // 验证 URL
    if (!url) {
        errorDiv.textContent = '请输入导航站地址';
        errorDiv.style.display = 'block';
        return;
    }
    
    // 简单的 URL 验证
    try {
        const urlObj = new URL(url);
        if (!urlObj.protocol.startsWith('http')) {
            throw new Error('Invalid protocol');
        }
    } catch (e) {
        errorDiv.textContent = '请输入有效的 URL 地址（需包含 http:// 或 https://）';
        errorDiv.style.display = 'block';
        return;
    }
    
    // 隐藏错误信息
    errorDiv.style.display = 'none';
    
    // 显示加载状态
    loadingDiv.style.display = 'block';
    
    // 保存到存储
    chrome.storage.sync.set({ navUrl: url }, function() {
        // 跳转到导航站
        setTimeout(() => {
            window.location.href = url;
        }, 500);
    });
});

// 回车键保存
document.getElementById('navUrl').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('saveBtn').click();
    }
});
