// ==================== 后台服务脚本 ====================

// 扩展安装时
chrome.runtime.onInstalled.addListener((details) => {
    console.log('WorkBuddy Extension installed');

    // 创建右键菜单
    chrome.contextMenus.create({
        id: 'workbuddy-extract',
        title: '📌 用Knexio提取文章',
        contexts: ['page']
    });

    // 启用侧边栏模式
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// 允许所有标签页使用侧边栏
chrome.sidePanel.setOptions({ path: 'sidepanel.html' });

// 右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'workbuddy-extract' && tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'extractArticle' });
    }
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        console.log('Tab updated:', tab.url);
    }
});

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        if (request.action === 'captureFullPage') {
            chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
                sendResponse({ dataUrl: dataUrl });
            });
            return true;
        }

        if (request.action === 'getCurrentTab') {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                sendResponse(tabs[0] || null);
            });
            return true;
        }
    } catch (err) {
        sendResponse({ error: err.message });
    }
    return false;
});