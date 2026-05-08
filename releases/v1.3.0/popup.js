// ==================== 全局变量 ====================
let extractedArticle = {
    title: '',
    url: '',
    content: '',
    text: ''
};

// 检测是否为popup模式（popup有window.close，侧边栏没有）
const isPopupMode = typeof window.close === 'function' && !window.location.href.includes('sidepanel');

// 统一关闭函数
const closeWindow = () => {
    if (isPopupMode) window.close();
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 使用事件委托避免inline事件检测
    document.addEventListener('click', handleClick);
    document.addEventListener('input', handleInput);

    // 初始化加载标签页
    loadTabs();
});

// ==================== 事件处理 ====================
function handleClick(e) {
    // 向上查找带 data-tab 或 data-action 的元素
    let el = e.target;
    while (el && el !== document) {
        if (el.dataset.tab) {
            switchTab(el.dataset.tab);
            return;
        }
        if (el.dataset.action) {
            handleAction(el.dataset.action);
            return;
        }
        el = el.parentElement;
    }
}

function handleAction(action) {
    switch (action) {
        case 'close-all':
            closeAllTabs();
            break;
        case 'group':
            groupByDomain();
            break;
        case 'save-note':
            saveNote();
            break;
        case 'load-note':
            loadNote();
            break;
        case 'clear-note':
            clearNote();
            break;
        case 'capture-visible':
            captureVisible();
            break;
        case 'capture-fullpage':
            captureFullPage();
            break;
        case 'extract-article':
            extractArticle();
            break;
        case 'generate-summary':
            generateSummary();
            break;
        case 'copy-article':
            copyArticle();
            break;
        case 'copy-summary':
            copySummary();
            break;
        case 'save-summary-note':
            saveSummaryToNote();
            break;
        case 'download-screenshot':
            downloadScreenshot();
            break;
        case 'copy-screenshot':
            copyScreenshot();
            break;
        case 'export-file':
            exportToFile();
            break;
        case 'import-file':
            importFromFile();
            break;
        case 'export-article':
            exportArticleToFile();
            break;
        case 'export-summary':
            exportSummaryToFile();
            break;
        case 'clear-history':
            clearHistory();
            break;
        case 'copy-detail':
            copyDetailContent();
            break;
        case 'export-detail':
            exportDetailContent();
            break;
        case 'delete-detail':
            deleteDetailContent();
            break;
        case 'send-article-knexio':
            sendArticleToKnexio();
            break;
    }
}

function handleInput(e) {
    // 笔记输入时自动保存，防止关闭丢失
    if (e.target.id === 'note-content') {
        autoSaveNote(e.target.value);
    }
}

// 实时自动保存笔记（防丢失）
let autoSaveTimer = null;
async function autoSaveNote(content) {
    // 防抖：停止之前计时器
    if (autoSaveTimer) clearTimeout(autoSaveTimer);

    // 延迟500ms后保存，等待用户停止输入
    autoSaveTimer = setTimeout(async () => {
        try {
            const timestamp = new Date().toISOString();
            await chrome.storage.local.set({
                workbuddy_note: content,
                workbuddy_note_time: timestamp,
                workbuddy_note_autosaved: true  // 标记为自动保存
            });
        } catch (err) {
            console.error('自动保存失败:', err);
        }
    }, 500);
}

// ==================== 标签页管理 ====================
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'tabs') loadTabs();
    else if (tabName === 'notes') { loadNote(); initFilePath(); }
    else if (tabName === 'article') updateArticleMeta();
    else if (tabName === 'history') { loadHistory(); hideDetail(); }
}

async function loadTabs() {
    try {
        const tabs = await chrome.tabs.query({});
        const tabList = document.getElementById('tab-list');

        if (!tabs || tabs.length === 0) {
            tabList.innerHTML = '<div class="empty-state">没有打开的标签页</div>';
            return;
        }

        tabList.innerHTML = tabs.map(tab => `
            <div class="tab-item" data-id="${tab.id}">
                <img src="${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22/>'}">
                <span title="${tab.title || '无标题'}">${tab.title || '无标题'}</span>
                <span class="close-btn" data-tabid="${tab.id}">×</span>
            </div>
        `).join('');

        tabList.querySelectorAll('.tab-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-btn')) {
                    closeTab(parseInt(e.target.dataset.tabid));
                } else {
                    chrome.tabs.update(parseInt(item.dataset.id), { active: true });
                    closeWindow();
                }
            });
        });
    } catch (err) {
        console.error('加载标签页失败:', err);
        document.getElementById('tab-list').innerHTML = '<div class="empty-state">加载失败</div>';
    }
}

async function closeTab(tabId) {
    try {
        await chrome.tabs.remove(tabId);
        loadTabs();
    } catch (err) {
        console.error('关闭标签页失败:', err);
    }
}

async function closeAllTabs() {
    try {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const current = tabs.find(t => t.active);

        for (const tab of tabs) {
            if (tab.id !== current.id) {
                try {
                    await chrome.tabs.remove(tab.id);
                } catch {}
            }
        }
        loadTabs();
    } catch (err) {
        console.error('关闭标签页失败:', err);
    }
}

async function groupByDomain() {
    try {
        const tabs = await chrome.tabs.query({});
        const groups = {};

        tabs.forEach(tab => {
            try {
                if (tab.url && tab.url.startsWith('http')) {
                    const domain = new URL(tab.url).hostname;
                    if (!groups[domain]) groups[domain] = [];
                    groups[domain].push(tab);
                }
            } catch {}
        });

        const tabList = document.getElementById('tab-list');
        const domains = Object.keys(groups).sort();

        if (domains.length === 0) {
            tabList.innerHTML = '<div class="empty-state">没有可显示的标签页</div>';
            return;
        }

        tabList.innerHTML = domains.map(domain => `
            <div style="margin: 8px 0;">
                <div style="font-size: 12px; color: #7f8c8d; padding: 4px 0; font-weight: bold;">${domain} (${groups[domain].length})</div>
                ${groups[domain].map(tab => `
                    <div class="tab-item" data-id="${tab.id}">
                        <img src="${tab.favIconUrl || 'data:image/svg+xml,<svg/>'}" style="width:14px;height:14px;">
                        <span title="${tab.title || '无标题'}">${(tab.title || '无标题').substring(0, 25)}</span>
                    </div>
                `).join('')}
            </div>
        `).join('');

        tabList.querySelectorAll('.tab-item').forEach(item => {
            item.addEventListener('click', () => {
                chrome.tabs.update(parseInt(item.dataset.id), { active: true });
                window.close();
            });
        });
    } catch (err) {
        console.error('分组失败:', err);
    }
}

// ==================== 笔记功能 ====================
async function saveNote() {
    try {
        const content = document.getElementById('note-content').value;
        const timestamp = new Date().toISOString();
        await chrome.storage.local.set({ workbuddy_note: content, workbuddy_note_time: timestamp });
        showStatus('note-status', '✅ 笔记已保存');
    } catch (err) {
        showError('note-status', '保存失败');
    }
}

async function loadNote() {
    try {
        const result = await chrome.storage.local.get(['workbuddy_note', 'workbuddy_note_time']);
        document.getElementById('note-content').value = result.workbuddy_note || '';
        if (result.workbuddy_note_time) {
            const date = new Date(result.workbuddy_note_time);
            showStatus('note-status', `📂 已加载 (保存于 ${date.toLocaleDateString()})`);
        }
    } catch (err) {
        showError('note-status', '加载失败');
    }
}

async function clearNote() {
    if (confirm('确定要清空笔记吗？')) {
        try {
            await chrome.storage.local.remove(['workbuddy_note', 'workbuddy_note_time']);
            document.getElementById('note-content').value = '';
            showStatus('note-status', '🗑️ 笔记已清空');
        } catch (err) {
            showError('note-status', '清空失败');
        }
    }
}

// ==================== 文件导出/导入 ====================
let savedFileHandle = null;

async function exportToFile() {
    try {
        const content = document.getElementById('note-content').value;
        if (!content.trim()) {
            showError('note-status', '笔记为空，无内容可导出');
            return;
        }

        // 如果没有保存过文件句柄，让用户选择
        if (!savedFileHandle) {
            const options = {
                suggestedName: 'workbuddy-notes.md',
                types: [{
                    description: 'Markdown文件',
                    accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] }
                }]
            };
            savedFileHandle = await window.showSaveFilePicker(options);
        }

        // 写入文件
        const writable = await savedFileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        // 显示保存路径，并加发送到knexio链接
        const pathEl = document.getElementById('file-path');
        const pathSpan = document.getElementById('saved-path');
        pathSpan.innerHTML = `${savedFileHandle.name} <a href="#" onclick="sendToKnexio('note', '我的笔记', document.getElementById('note-content').value); return false;" style="color:#3498db;margin-left:8px;text-decoration:none;">→ 发送到knexio</a>`;
        pathEl.style.display = 'block';

        // 保存到storage以便下次使用
        await chrome.storage.local.set({ savedFileName: savedFileHandle.name });

        // 同时保存到历史
        await saveToHistory({
            type: 'note',
            title: '笔记备份 - ' + new Date().toLocaleDateString(),
            url: '',
            content: content,
            markdown: content,
            savedAt: new Date().toISOString()
        });

        showStatus('note-status', '✅ 已导出并保存到历史: ' + savedFileHandle.name);
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('导出失败:', err);
            showError('note-status', '导出失败: ' + err.message);
        }
    }
}

async function importFromFile() {
    try {
        const options = {
            types: [{
                description: '文本文件',
                accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] }
            }],
            multiple: false
        };
        const [fileHandle] = await window.showOpenFilePicker(options);
        const file = await fileHandle.getFile();
        const content = await file.text();

        document.getElementById('note-content').value = content;
        savedFileHandle = fileHandle;

        // 显示路径
        const pathEl = document.getElementById('file-path');
        const pathSpan = document.getElementById('saved-path');
        pathSpan.textContent = fileHandle.name;
        pathEl.style.display = 'block';

        await chrome.storage.local.set({ savedFileName: fileHandle.name, workbuddy_note: content });
        showStatus('note-status', '✅ 已导入: ' + fileHandle.name);
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('导入失败:', err);
            showError('note-status', '导入失败: ' + err.message);
        }
    }
}

// 初始化时恢复显示上次保存路径
async function initFilePath() {
    try {
        const result = await chrome.storage.local.get(['savedFileName']);
        if (result.savedFileName) {
            const pathEl = document.getElementById('file-path');
            const pathSpan = document.getElementById('saved-path');
            pathSpan.textContent = result.savedFileName + ' (点击"导出"重新保存)';
            pathEl.style.display = 'block';
        }
    } catch {}
}

function showStatus(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        el.style.color = '#27ae60';
        setTimeout(() => el.style.display = 'none', 3000);
    }
}

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        el.style.color = '#e74c3c';
        setTimeout(() => el.style.display = 'none', 3000);
    }
}

// ==================== 截屏功能 ====================
async function captureVisible() {
    try {
        document.getElementById('screenshot-result').innerHTML = '<div class="loading">截取中...</div>';
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
        showScreenshotResult(dataUrl);
    } catch (err) {
        showError('screenshot-result', '截屏失败: ' + err.message);
    }
}

async function captureFullPage() {
    try {
        document.getElementById('screenshot-result').innerHTML = '<div class="loading">正在截取完整页面...</div>';

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.id) {
            throw new Error('无法获取当前标签页');
        }

        const pageInfo = await chrome.tabs.sendMessage(tab.id, { action: 'getPageSize' });
        const contentHeight = pageInfo.contentHeight;
        const contentWidth = pageInfo.contentWidth;

        const canvas = document.createElement('canvas');
        canvas.width = contentWidth;
        canvas.height = contentHeight;
        const ctx = canvas.getContext('2d');

        const viewportHeight = window.screen.height || 800;
        let y = 0;

        while (y < contentHeight) {
            await chrome.tabs.sendMessage(tab.id, { action: 'scrollTo', y });
            await new Promise(resolve => setTimeout(resolve, 100));

            const partial = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
            const img = await loadImage(partial);
            ctx.drawImage(img, 0, y);
            y += viewportHeight;
        }

        await chrome.tabs.sendMessage(tab.id, { action: 'scrollTo', y: 0 });

        const dataUrl = canvas.toDataURL('image/png');
        showScreenshotResult(dataUrl);
    } catch (err) {
        showError('screenshot-result', '完整页面截屏失败: ' + err.message);
    }
}

function showScreenshotResult(dataUrl) {
    const container = document.getElementById('screenshot-result');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    container.innerHTML = `
        <div style="border: 1px solid #ddd; border-radius: 6px; overflow: hidden;">
            <img src="${dataUrl}" style="width: 100%; display: block;" id="screenshot-img">
        </div>
        <div class="btn-row">
            <button class="btn btn-primary" id="download-screenshot" data-action="download-screenshot">💾 下载图片</button>
            <button class="btn btn-secondary" id="copy-screenshot" data-action="copy-screenshot">📋 复制到剪贴板</button>
        </div>
    `;

    // 存储当前截图数据
    window.currentScreenshot = { dataUrl, timestamp };
}

function downloadScreenshot() {
    const { dataUrl, timestamp } = window.currentScreenshot || {};
    if (dataUrl) {
        chrome.downloads.download({
            url: dataUrl,
            filename: `screenshot-${timestamp}.png`
        });
    }
}

async function copyScreenshot() {
    const { dataUrl } = window.currentScreenshot || {};
    if (!dataUrl) return;

    try {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);
        showStatus('screenshot-result', '✅ 已复制到剪贴板');
    } catch {
        showError('screenshot-result', '复制失败，请尝试右键保存图片');
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// ==================== 文章摘要与全文提取 ====================
async function updateArticleMeta() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        document.getElementById('article-meta').innerHTML = `
            <strong>${tab.title || '未命名页面'}</strong><br>
            <span style="font-size: 11px; color: #95a5a6;">${tab.url || ''}</span>
        `;
        extractedArticle = { title: tab.title || '', url: tab.url || '', content: '', text: '' };
    } catch (err) {
        console.error('更新文章信息失败:', err);
    }
}

async function extractArticle() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.id) {
            throw new Error('无法获取当前标签页');
        }

        document.getElementById('article-content').innerHTML = '<div class="loading">正在提取文章内容...</div>';

        const result = await chrome.tabs.sendMessage(tab.id, { action: 'extractArticle' });

        if (!result || !result.text || result.text.length < 100) {
            document.getElementById('article-content').innerHTML = `
                <div class="empty-state">
                    <p>⚠️ 无法提取文章内容</p>
                    <p style="font-size: 11px; margin-top: 8px;">可能原因：</p>
                    <ul style="font-size: 11px; text-align: left; display: inline-block; margin-top: 4px;">
                        <li>页面需要登录才能查看</li>
                        <li>页面使用特殊技术加载</li>
                        <li>页面主要内容在iframe中</li>
                    </ul>
                </div>
            `;
            return;
        }

        const articleTitle = result.title || tab.title || '';
        extractedArticle = {
            title: articleTitle,
            url: tab.url || '',
            content: result.content || '',
            text: articleTitle ? articleTitle + '\n\n' + result.text : result.text
        };

        const displayText = extractedArticle.text.length > 5000
            ? extractedArticle.text.substring(0, 5000) + '\n\n... (内容已截断)'
            : extractedArticle.text;

        document.getElementById('article-content').innerHTML = `
            <div style="padding: 8px; font-size: 12px; color: #27ae60; background: #e8f8f0; border-radius: 4px; margin-bottom: 8px;">
                ✅ 已提取 ${extractedArticle.text.length} 字
            </div>
            <div style="white-space: pre-wrap; font-size: 13px; line-height: 1.8;">${escapeHtml(displayText)}</div>
        `;

        document.getElementById('summary-section').style.display = 'block';
        document.getElementById('summary-result').innerHTML = '<div style="color: #7f8c8d;">点击"生成摘要"获取智能摘要</div>';

    } catch (err) {
        showError('article-content', '提取失败: ' + err.message);
    }
}

async function generateSummary() {
    if (!extractedArticle.text || extractedArticle.text.length < 100) {
        alert('请先提取文章内容');
        return;
    }

    const summaryDiv = document.getElementById('summary-result');
    summaryDiv.innerHTML = '<div class="loading">✨ 正在生成摘要...</div>';

    const summary = extractiveSummarize(extractedArticle.text, 5);

    summaryDiv.innerHTML = `
        <div style="font-size: 14px; line-height: 1.8;">${escapeHtml(summary)}</div>
        <div style="margin-top: 10px; font-size: 11px; color: #7f8c8d;">
            📊 基于 ${extractedArticle.text.length} 字原文提取
        </div>
    `;
}

function extractiveSummarize(text, numSentences = 5) {
    const sentences = text.match(/[^.!?。！？\n]+[.!?。！？\n]+/g) || [];

    if (sentences.length === 0) {
        return text.substring(0, 500) + (text.length > 500 ? '...' : '');
    }

    if (sentences.length <= numSentences) {
        return sentences.join('');
    }

    const scored = sentences.map((sentence, index) => {
        let score = 0;
        const position = index / sentences.length;
        score += (1 - Math.abs(0.5 - position)) * 2;

        const length = sentence.length;
        if (length > 50 && length < 200) score += 1;
        if (/\d+/.test(sentence)) score += 0.5;
        if (/%|百分比|率/.test(sentence)) score += 0.5;

        return { sentence: sentence.trim(), score, index };
    });

    const top = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, numSentences * 2)
        .sort((a, b) => a.index - b.index)
        .slice(0, numSentences);

    return top.map(s => s.sentence).join('');
}

async function copyArticle() {
    if (!extractedArticle.text) {
        alert('请先提取文章内容');
        return;
    }

    try {
        await navigator.clipboard.writeText(extractedArticle.text);
        showStatus('article-content', '✅ 全文已复制到剪贴板');
    } catch {
        showError('article-content', '复制失败');
    }
}

async function copySummary() {
    const summary = document.getElementById('summary-result').textContent;
    if (!summary || summary.includes('点击') || summary.includes('正在生成')) {
        alert('请先生成摘要');
        return;
    }

    try {
        await navigator.clipboard.writeText(summary);
        showStatus('summary-result', '✅ 摘要已复制');
    } catch {
        alert('复制失败');
    }
}

async function saveSummaryToNote() {
    const summary = document.getElementById('summary-result').textContent;
    if (!summary || summary.includes('点击') || summary.includes('正在生成')) {
        alert('请先生成摘要');
        return;
    }

    try {
        const currentNote = await chrome.storage.local.get(['workbuddy_note']);
        const newNote = `${currentNote.workbuddy_note || ''}\n\n--- 文章摘要 ---\n来源: ${extractedArticle.url}\n标题: ${extractedArticle.title}\n日期: ${new Date().toLocaleDateString()}\n\n${summary}`;

        await chrome.storage.local.set({ workbuddy_note: newNote, workbuddy_note_time: new Date().toISOString() });

        // 同时保存到历史
        await saveToHistory({
            type: 'summary',
            title: extractedArticle.title + ' - 摘要',
            url: extractedArticle.url,
            content: summary,
            markdown: `# ${extractedArticle.title} - 摘要\n\n**来源**: ${extractedArticle.url}\n\n**日期**: ${new Date().toLocaleDateString()}\n\n---\n\n${summary}`,
            savedAt: new Date().toISOString()
        });

        showStatus('summary-result', '✅ 已保存到笔记和历史');
    } catch {
        showError('summary-result', '保存失败');
    }
}

// ==================== 文章导出功能 ====================
async function exportArticleToFile() {
    if (!extractedArticle.text) {
        showArticleStatus('⚠️ 请先提取文章内容');
        return;
    }

    try {
        const markdown = `# ${extractedArticle.title}\n\n**来源**: ${extractedArticle.url}\n\n**日期**: ${new Date().toLocaleDateString()}\n\n---\n\n${extractedArticle.text}`;

        const suggestedName = extractedArticle.title
            ? extractedArticle.title.substring(0, 50).replace(/[<>:"/\\|?*]/g, '') + '.md'
            : 'article.md';

        const options = {
            suggestedName: suggestedName,
            types: [{
                description: 'Markdown文件',
                accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] }
            }]
        };

        const fileHandle = await window.showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();
        await writable.write(markdown);
        await writable.close();

        // 同时保存到历史
        await saveToHistory({
            type: 'article',
            title: extractedArticle.title,
            url: extractedArticle.url,
            content: extractedArticle.text,
            markdown: markdown,
            savedAt: new Date().toISOString()
        });

        showArticleStatus('✅ 已导出并保存到历史: ' + fileHandle.name);
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('导出失败:', err);
            showArticleStatus('导出失败: ' + err.message);
        }
    }
}

async function exportSummaryToFile() {
    const summary = document.getElementById('summary-result').textContent;
    if (!summary || summary.includes('点击') || summary.includes('正在生成')) {
        showArticleStatus('⚠️ 请先生成摘要');
        return;
    }

    try {
        const markdown = `# ${extractedArticle.title} - 摘要\n\n**来源**: ${extractedArticle.url}\n\n**日期**: ${new Date().toLocaleDateString()}\n\n---\n\n${summary}`;

        const suggestedName = extractedArticle.title
            ? extractedArticle.title.substring(0, 50).replace(/[<>:"/\\|?*]/g, '') + '-摘要.md'
            : 'article-summary.md';

        const options = {
            suggestedName: suggestedName,
            types: [{
                description: 'Markdown文件',
                accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] }
            }]
        };

        const fileHandle = await window.showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();
        await writable.write(markdown);
        await writable.close();

        // 同时保存到历史
        await saveToHistory({
            type: 'summary',
            title: extractedArticle.title + ' - 摘要',
            url: extractedArticle.url,
            content: summary,
            markdown: markdown,
            savedAt: new Date().toISOString()
        });

        showArticleStatus('✅ 已导出并保存到历史: ' + fileHandle.name);
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('导出失败:', err);
            showArticleStatus('导出失败: ' + err.message);
        }
    }
}

function showArticleStatus(message) {
    const el = document.getElementById('article-status');
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        el.style.color = message.startsWith('✅') ? '#27ae60' : '#e74c3c';
        setTimeout(() => el.style.display = 'none', 4000);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== 历史记录功能 ====================
let currentDetailItem = null;

async function saveToHistory(item) {
    try {
        const result = await chrome.storage.local.get(['history']);
        const history = result.history || [];
        history.unshift(item);
        // 最多保存100条
        if (history.length > 100) history.pop();
        await chrome.storage.local.set({ history });
    } catch (err) {
        console.error('保存历史失败:', err);
    }
}

async function loadHistory() {
    try {
        const result = await chrome.storage.local.get(['history']);
        const history = result.history || [];

        const listEl = document.getElementById('history-list');

        if (history.length === 0) {
            listEl.innerHTML = '<div class="empty-state">暂无历史记录<br><br>导出文章时会自动保存到这里</div>';
            return;
        }

        listEl.innerHTML = history.map((item, index) => `
            <div class="history-item" data-index="${index}" style="padding:10px;margin:6px 0;background:#fff;border-radius:6px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.1);">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:11px;padding:2px 6px;border-radius:3px;background:${item.type === 'summary' ? '#fce588' : '#3498db'};color:#fff;">${item.type === 'summary' ? '摘要' : '全文'}</span>
                    <span style="flex:1;font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(item.title || '无标题')}</span>
                </div>
                <div style="font-size:11px;color:#7f8c8d;margin-top:4px;">${item.url ? new URL(item.url).hostname : ''} · ${formatDate(item.savedAt)}</div>
            </div>
        `).join('');

        // 点击事件
        listEl.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt(el.dataset.index);
                showHistoryDetail(history[index]);
            });
        });
    } catch (err) {
        console.error('加载历史失败:', err);
    }
}

function showHistoryDetail(item) {
    currentDetailItem = item;
    document.getElementById('detail-title').textContent = item.title || '无标题';
    document.getElementById('detail-meta').innerHTML = `${item.url ? '<a href="#" onclick="return false;" style="color:#3498db;">' + item.url + '</a>' : ''}<br>保存时间: ${formatDate(item.savedAt)}`;
    document.getElementById('detail-content').textContent = item.content;
    document.getElementById('history-detail').style.display = 'block';
    document.getElementById('detail-actions').style.display = 'flex';
}

function hideDetail() {
    currentDetailItem = null;
    document.getElementById('history-detail').style.display = 'none';
    document.getElementById('detail-actions').style.display = 'none';
}

async function clearHistory() {
    if (!confirm('确定要清空所有历史记录吗？')) return;
    try {
        await chrome.storage.local.remove(['history']);
        loadHistory();
        hideDetail();
    } catch (err) {
        console.error('清空历史失败:', err);
    }
}

function copyDetailContent() {
    if (!currentDetailItem) return;
    navigator.clipboard.writeText(currentDetailItem.content).then(() => {
        alert('已复制到剪贴板');
    }).catch(() => {
        alert('复制失败');
    });
}

async function exportDetailContent() {
    if (!currentDetailItem) return;
    try {
        const options = {
            suggestedName: (currentDetailItem.title || 'untitled').substring(0, 50).replace(/[<>:"/\\|?*]/g, '') + '.md',
            types: [{ description: 'Markdown文件', accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] } }]
        };
        const fileHandle = await window.showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();
        await writable.write(currentDetailItem.markdown || currentDetailItem.content);
        await writable.close();
        alert('已导出: ' + fileHandle.name);
    } catch (err) {
        if (err.name !== 'AbortError') alert('导出失败: ' + err.message);
    }
}

async function deleteDetailContent() {
    if (!currentDetailItem) return;
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
        const result = await chrome.storage.local.get(['history']);
        const history = result.history || [];
        const newHistory = history.filter((_, i) => i !== history.indexOf(currentDetailItem));
        await chrome.storage.local.set({ history });
        loadHistory();
        hideDetail();
    } catch (err) {
        console.error('删除历史失败:', err);
    }
}

function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ==================== 发送到knexio.xyz ====================
function sendToKnexio(type, title, content) {
    const encodedContent = encodeURIComponent(content || '');
    const encodedTitle = encodeURIComponent(title || 'WorkBuddy分享');
    let shareUrl = `https://knexio.xyz/share?title=${encodedTitle}&type=${type}`;
    chrome.tabs.create({ url: shareUrl });
}

function sendArticleToKnexio() {
    if (!extractedArticle.text) {
        showArticleStatus('⚠️ 请先提取文章内容');
        return;
    }
    // 打开新标签跳转到knexio分享页
    const title = encodeURIComponent(extractedArticle.title || '文章');
    const url = encodeURIComponent(extractedArticle.url || '');
    const text = encodeURIComponent(extractedArticle.text.substring(0, 500));
    const shareUrl = `https://knexio.xyz/share?title=${title}&url=${url}&content=${text}&type=article`;
    chrome.tabs.create({ url: shareUrl });
    showArticleStatus('✅ 正在跳转到knexio...');
}
