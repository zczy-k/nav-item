// 加载当前设置
chrome.storage.sync.get(['navUrl'], function(result) {
    const urlElement = document.getElementById('currentUrl');
    const openNavBtn = document.getElementById('openNav');
    
    if (result.navUrl) {
        urlElement.textContent = result.navUrl;
        urlElement.classList.remove('empty');
        openNavBtn.disabled = false;
    } else {
        urlElement.textContent = '未设置';
        urlElement.classList.add('empty');
        openNavBtn.disabled = true;
    }
});

// 打开设置页面
document.getElementById('openSettings').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
});

// 访问导航站
document.getElementById('openNav').addEventListener('click', function() {
    chrome.storage.sync.get(['navUrl'], function(result) {
        if (result.navUrl) {
            chrome.tabs.create({ url: result.navUrl });
        }
    });
});
