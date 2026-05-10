// ==================== 全局变量 ====================
let extractedArticle = { title: '', url: '', content: '', text: '' };

const isPopupMode = typeof window.close === 'function' && !window.location.href.includes('sidepanel');
const closeWindow = () => { if (isPopupMode) window.close(); };

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', handleClick);
    document.addEventListener('input', handleInput);
    loadTabs();
});

// ==================== 事件处理 ====================
function handleClick(e) {
    let el = e.target;
    while (el && el !== document) {
        if (el.dataset.tab) { switchTab(el.dataset.tab); return; }
        if (el.dataset.action) { handleAction(el.dataset.action); return; }
        el = el.parentElement;
    }
}

function handleAction(action) {
    switch (action) {
        case 'close-all':       closeAllTabs(); break;
        case 'group':          groupByDomain(); break;
        case 'save-note':      saveNote(); break;
        case 'load-note':      loadNote(); break;
        case 'clear-note':    clearNote(); break;
        case 'capture-visible': captureVisible(); break;
        case 'capture-fullpage': captureFullPage(); break;
        case 'extract-article': extractArticle(); break;
        case 'generate-summary': generateSummary(); break;
        case 'save-summary-note': saveSummaryToNote(); break;
        case 'download-screenshot': downloadScreenshot(); break;
        case 'copy-screenshot': copyScreenshot(); break;
        case 'export-file':    exportToFile(); break;
        case 'import-file':    importFromFile(); break;
        case 'export-article': exportArticleToFile(); break;
        case 'export-summary': exportSummaryToFile(); break;
        case 'edit-full-md':     openEditMd('full'); break;
        case 'edit-summary-md':  openEditMd('summary'); break;
        case 'clear-history':  clearHistory(); break;
        case 'copy-detail':   copyDetailContent(); break;
        case 'export-detail':  exportDetailContent(); break;
        case 'delete-detail':  deleteDetailContent(); break;
    }
}

function handleInput(e) {
    if (e.target.id === 'note-content') autoSaveNote(e.target.value);
}

// ==================== 自动保存 ====================
let autoSaveTimer = null;
async function autoSaveNote(content) {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(async () => {
        try {
            await chrome.storage.local.set({
                workbuddy_note: content,
                workbuddy_note_time: new Date().toISOString(),
                workbuddy_note_autosaved: true
            });
            showStatus('note-status', t('autoSaved'));
        } catch (err) { console.error('自动保存失败:', err); }
    }, 500);
}

// ==================== 标签页管理 ====================
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
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
            tabList.innerHTML = `<div class="empty-state">${t('noTabs')}</div>`;
            return;
        }
        tabList.innerHTML = tabs.map(tab => `
            <div class="tab-item" data-id="${tab.id}">
                <img src="${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22/>'}">
                <span title="${tab.title || t('noTitle')}">${(tab.title || t('noTitle')).substring(0, 40)}</span>
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
        document.getElementById('tab-list').innerHTML = `<div class="empty-state">${t('loadFailed')}</div>`;
    }
}

async function closeTab(tabId) {
    try { await chrome.tabs.remove(tabId); loadTabs(); }
    catch (err) { console.error('关闭标签页失败:', err); }
}

async function closeAllTabs() {
    try {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const current = tabs.find(t => t.active);
        for (const tab of tabs) {
            if (tab.id !== current.id) { try { await chrome.tabs.remove(tab.id); } catch {} }
        }
        loadTabs();
    } catch (err) { console.error('关闭标签页失败:', err); }
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
            tabList.innerHTML = `<div class="empty-state">${t('noTabs')}</div>`;
            return;
        }
        tabList.innerHTML = domains.map(domain => `
            <div style="margin:8px 0;">
                <div style="font-size:12px;color:#7f8c8d;padding:4px 0;font-weight:bold;">${domain} (${groups[domain].length})</div>
                ${groups[domain].map(tab => `
                    <div class="tab-item" data-id="${tab.id}">
                        <img src="${tab.favIconUrl || 'data:image/svg+xml,<svg/>'}" style="width:14px;height:14px;">
                        <span title="${tab.title || t('noTitle')}">${(tab.title || t('noTitle')).substring(0, 25)}</span>
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
    } catch (err) { console.error('分组失败:', err); }
}

// ==================== 笔记功能 ====================
async function saveNote() {
    try {
        const content = document.getElementById('note-content').value;
        await chrome.storage.local.set({
            workbuddy_note: content,
            workbuddy_note_time: new Date().toISOString()
        });
        showStatus('note-status', t('saved'));
    } catch (err) { showError('note-status', t('saveFailed')); }
}

async function loadNote() {
    try {
        const result = await chrome.storage.local.get(['workbuddy_note', 'workbuddy_note_time']);
        document.getElementById('note-content').value = result.workbuddy_note || '';
        if (result.workbuddy_note_time) {
            const d = new Date(result.workbuddy_note_time);
            showStatus('note-status', `${t('loaded')} (${t('savedAt')} ${d.toLocaleDateString()})`);
        }
    } catch (err) { showError('note-status', t('loadFailed')); }
}

async function clearNote() {
    if (!confirm(t('confirmClear'))) return;
    try {
        await chrome.storage.local.remove(['workbuddy_note', 'workbuddy_note_time']);
        document.getElementById('note-content').value = '';
        showStatus('note-status', t('cleared'));
    } catch (err) { showError('note-status', t('clearFailed')); }
}

// ==================== 文件导出/导入 ====================
let savedFileHandle = null;

async function exportToFile() {
    try {
        const content = document.getElementById('note-content').value;
        if (!content.trim()) { showError('note-status', t('noteEmpty')); return; }
        if (!savedFileHandle) {
            savedFileHandle = await window.showSaveFilePicker({
                suggestedName: 'workbuddy-notes.md',
                types: [{ description: 'Markdown文件', accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] } }]
            });
        }
        const writable = await savedFileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        await chrome.storage.local.set({ savedFileName: savedFileHandle.name });
        await saveToHistory({
            type: 'note', title: `${t('notes')} - ${new Date().toLocaleDateString()}`,
            url: '', content, markdown: content, savedAt: new Date().toISOString()
        });
        showStatus('note-status', `${t('exported')}: ${savedFileHandle.name}`);
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('导出失败:', err);
            showError('note-status', `${t('exportFailed')}: ${err.message}`);
        }
    }
}

async function importFromFile() {
    try {
        const [fileHandle] = await window.showOpenFilePicker({
            types: [{ description: '文本文件', accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] } }],
            multiple: false
        });
        const file = await fileHandle.getFile();
        const content = await file.text();
        document.getElementById('note-content').value = content;
        savedFileHandle = fileHandle;
        document.getElementById('saved-path').textContent = fileHandle.name;
        document.getElementById('file-path').style.display = 'block';
        await chrome.storage.local.set({ savedFileName: fileHandle.name, workbuddy_note: content });
        showStatus('note-status', `${t('import')}: ${fileHandle.name}`);
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('导入失败:', err);
            showError('note-status', `${t('import')} ${t('saveFailed')}: ${err.message}`);
        }
    }
}

async function initFilePath() {
    try {
        const result = await chrome.storage.local.get(['savedFileName']);
        if (result.savedFileName) {
            document.getElementById('saved-path').textContent = `${result.savedFileName} (${t('export')})`;
            document.getElementById('file-path').style.display = 'block';
        }
    } catch {}
}

function showStatus(elementId, message) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    el.style.color = '#27ae60';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    el.style.color = '#e74c3c';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// ==================== 截屏功能 ====================
async function captureVisible() {
    try {
        document.getElementById('screenshot-result').innerHTML = `<div class="loading">${t('capturing')}</div>`;
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
        showScreenshotResult(dataUrl);
    } catch (err) { showError('screenshot-result', `${t('screenshotFailed')}: ${err.message}`); }
}

async function captureFullPage() {
    try {
        document.getElementById('screenshot-result').innerHTML = `<div class="loading">${t('capturingFull')}</div>`;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) throw new Error(t('loadFailed'));
        const pageInfo = await chrome.tabs.sendMessage(tab.id, { action: 'getPageSize' });
        const canvas = document.createElement('canvas');
        canvas.width = pageInfo.contentWidth;
        canvas.height = pageInfo.contentHeight;
        const ctx = canvas.getContext('2d');
        const viewportHeight = window.screen.height || 800;
        let y = 0;
        while (y < pageInfo.contentHeight) {
            await chrome.tabs.sendMessage(tab.id, { action: 'scrollTo', y });
            await new Promise(r => setTimeout(r, 100));
            const partial = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
            const img = await loadImage(partial);
            ctx.drawImage(img, 0, y);
            y += viewportHeight;
        }
        await chrome.tabs.sendMessage(tab.id, { action: 'scrollTo', y: 0 });
        showScreenshotResult(canvas.toDataURL('image/png'));
    } catch (err) { showError('screenshot-result', `${t('fullScreenshotFailed')}: ${err.message}`); }
}

function showScreenshotResult(dataUrl) {
    const container = document.getElementById('screenshot-result');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    container.innerHTML = `
        <div style="border:1px solid #ddd;border-radius:6px;overflow:hidden;">
            <img src="${dataUrl}" style="width:100%;display:block;" id="screenshot-img">
        </div>
        <div class="btn-row">
            <button class="btn btn-primary" id="download-screenshot" data-action="download-screenshot">${t('save')}</button>
            <button class="btn btn-secondary" id="copy-screenshot" data-action="copy-screenshot">${t('copy')}</button>
        </div>`;
    window.currentScreenshot = { dataUrl, timestamp };
}

function downloadScreenshot() {
    const { dataUrl, timestamp } = window.currentScreenshot || {};
    if (dataUrl) chrome.downloads.download({ url: dataUrl, filename: `screenshot-${timestamp}.png` });
}

async function copyScreenshot() {
    const { dataUrl } = window.currentScreenshot || {};
    if (!dataUrl) return;
    try {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showStatus('screenshot-result', t('copied'));
    } catch { showError('screenshot-result', t('copyFailed')); }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img); img.onerror = reject; img.src = src;
    });
}

// ==================== 文章摘要与全文提取 ====================
async function updateArticleMeta() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        document.getElementById('article-meta').innerHTML = `
            <strong>${tab.title || t('noTitle')}</strong><br>
            <span style="font-size:11px;color:#95a5a6;">${tab.url || ''}</span>`;
        extractedArticle = { title: tab.title || '', url: tab.url || '', content: '', text: '' };
    } catch (err) { console.error('更新文章信息失败:', err); }
}

async function extractArticle() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) throw new Error(t('loadFailed'));
        document.getElementById('article-content').innerHTML = `<div class="loading">${t('extracting')}</div>`;
        const result = await chrome.tabs.sendMessage(tab.id, { action: 'extractArticle' });
        if (!result || !result.text || result.text.length < 100) {
            document.getElementById('article-content').innerHTML = `
                <div class="empty-state">
                    <p>⚠️ ${t('extractFailed')}</p>
                    <p style="font-size:11px;margin-top:8px;">${t('extractFailedReason')}</p>
                </div>`;
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
            <div style="padding:8px;font-size:12px;color:#27ae60;background:#e8f8f0;border-radius:4px;margin-bottom:8px;">
                ${t('extractedChars', extractedArticle.text.length)}
            </div>
            <div style="white-space:pre-wrap;font-size:13px;line-height:1.8;">${escapeHtml(displayText)}</div>`;
        document.getElementById('summary-section').style.display = 'block';
        document.getElementById('summary-result').innerHTML = `<div style="color:#7f8c8d;">${t('clickToSummary')}</div>`;
    } catch (err) { showError('article-content', `${t('extractFailed')}: ${err.message}`); }
}

async function generateSummary() {
    if (!extractedArticle.text || extractedArticle.text.length < 100) {
        alert(t('pleaseExtract')); return;
    }
    const summaryDiv = document.getElementById('summary-result');
    summaryDiv.innerHTML = `<div class="loading">${t('generating')}</div>`;
    const summary = extractiveSummarize(extractedArticle.text, 5);
    extractedArticle.summary = summary;
    const summaryHtml = escapeHtml(summary).replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    summaryDiv.innerHTML = `
        <div style="font-size:14px;line-height:1.8;">${summaryHtml}</div>
        <div style="margin-top:10px;font-size:11px;color:#7f8c8d;">📊 ${t('extractedChars', extractedArticle.text.length)}</div>`;
}

function extractiveSummarize(text, numSentences = 5) {
    const sentences = text.match(/[^.!?。！？\n]+[.!?。！？\n]+/g) || [];
    if (sentences.length === 0) return text.substring(0, 500) + (text.length > 500 ? '...' : '');
    if (sentences.length <= numSentences) return sentences.map(s => s.trim()).join('\n\n');
    const scored = sentences.map((sentence, index) => {
        let score = 0;
        score += (1 - Math.abs(0.5 - index / sentences.length)) * 2;
        const len = sentence.length;
        if (len > 50 && len < 200) score += 1;
        if (/\d+/.test(sentence)) score += 0.5;
        if (/%|百分比|率/.test(sentence)) score += 0.5;
        return { sentence: sentence.trim(), score, index };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, numSentences * 2)
        .sort((a, b) => a.index - b.index).slice(0, numSentences)
        .map(s => s.sentence).join('\n\n');
}

async function saveSummaryToNote() {
    if (!extractedArticle.summary) { alert(t('pleaseGenerate')); return; }
    const summary = extractedArticle.summary;
    try {
        const currentNote = await chrome.storage.local.get(['workbuddy_note']);
        const newNote = `${currentNote.workbuddy_note || ''}\n\n--- 文章摘要 ---\n来源: ${extractedArticle.url}\n标题: ${extractedArticle.title}\n日期: ${new Date().toLocaleDateString()}\n\n${summary}`;
        await chrome.storage.local.set({ workbuddy_note: newNote, workbuddy_note_time: new Date().toISOString() });
        await saveToHistory({
            type: 'summary', title: `${extractedArticle.title} - ${t('smartSummary')}`,
            url: extractedArticle.url, content: summary,
            markdown: `# ${extractedArticle.title} - ${t('smartSummary')}\n\n**来源**: ${extractedArticle.url}\n\n**日期**: ${new Date().toLocaleDateString()}\n\n---\n\n${summary}`,
            savedAt: new Date().toISOString()
        });
        showStatus('summary-result', t('savedToNote'));
    } catch { showError('summary-result', t('saveFailed')); }
}

// ==================== 文章导出 ====================
async function exportArticleToFile() {
    if (!extractedArticle.text) { showArticleStatus(t('pleaseExtract')); return; }
    try {
        const markdown = `# ${extractedArticle.title}\n\n**来源**: ${extractedArticle.url}\n\n**日期**: ${new Date().toLocaleDateString()}\n\n---\n\n${extractedArticle.text}`;
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: (extractedArticle.title ? extractedArticle.title.substring(0, 50).replace(/[<>:"/\\|?*]/g, '') + '.md' : 'article.md'),
            types: [{ description: 'Markdown文件', accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] } }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(markdown);
        await writable.close();
        await saveToHistory({
            type: 'article', title: extractedArticle.title,
            url: extractedArticle.url, content: extractedArticle.text,
            markdown, savedAt: new Date().toISOString()
        });
        showArticleStatus(`${t('exported')}: ${fileHandle.name}`);
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('导出失败:', err);
            showArticleStatus(`${t('exportFailed')}: ${err.message}`);
        }
    }
}

async function exportSummaryToFile() {
    if (!extractedArticle.summary) { showArticleStatus(t('pleaseGenerate')); return; }
    const summary = extractedArticle.summary;
    try {
        const markdown = `# ${extractedArticle.title} - ${t('smartSummary')}\n\n**来源**: ${extractedArticle.url}\n\n**日期**: ${new Date().toLocaleDateString()}\n\n---\n\n${summary}`;
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: (extractedArticle.title ? extractedArticle.title.substring(0, 50).replace(/[<>:"/\\|?*]/g, '') + '-摘要.md' : 'article-summary.md'),
            types: [{ description: 'Markdown文件', accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] } }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(markdown);
        await writable.close();
        await saveToHistory({
            type: 'summary', title: `${extractedArticle.title} - ${t('smartSummary')}`,
            url: extractedArticle.url, content: summary,
            markdown, savedAt: new Date().toISOString()
        });
        showArticleStatus(`${t('exported')}: ${fileHandle.name}`);
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('导出失败:', err);
            showArticleStatus(`${t('exportFailed')}: ${err.message}`);
        }
    }
}

function showArticleStatus(message) {
    const el = document.getElementById('article-status');
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    el.style.color = message.includes('⚠️') ? '#e74c3c' : '#27ae60';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== 历史记录 ====================
let currentDetailItem = null;

async function saveToHistory(item) {
    try {
        const result = await chrome.storage.local.get(['history']);
        const history = result.history || [];
        history.unshift(item);
        if (history.length > 100) history.pop();
        await chrome.storage.local.set({ history });
    } catch (err) { console.error('保存历史失败:', err); }
}

async function loadHistory() {
    try {
        const result = await chrome.storage.local.get(['history']);
        const history = result.history || [];
        const listEl = document.getElementById('history-list');
        if (history.length === 0) {
            listEl.innerHTML = `<div class="empty-state">${t('noHistory')}<br><br>${t('export')}${t('articleExtract')}</div>`;
            return;
        }
        listEl.innerHTML = history.map((item, index) => `
            <div class="history-item" data-index="${index}" style="padding:10px;margin:6px 0;background:#fff;border-radius:6px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.1);">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:11px;padding:2px 6px;border-radius:3px;background:${item.type === 'summary' ? '#fce588' : '#3498db'};color:#fff;">${item.type === 'summary' ? t('smartSummary') : t('articleExtract')}</span>
                    <span style="flex:1;font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(item.title || t('noTitle'))}</span>
                </div>
                <div style="font-size:11px;color:#7f8c8d;margin-top:4px;">${item.url ? new URL(item.url).hostname : t('unknownDomain')} · ${formatDate(item.savedAt)}</div>
            </div>`).join('');
        listEl.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => showHistoryDetail(history[parseInt(el.dataset.index)]));
        });
    } catch (err) { console.error('加载历史失败:', err); }
}

function showHistoryDetail(item) {
    currentDetailItem = item;
    document.getElementById('detail-title').textContent = item.title || t('noTitle');
    document.getElementById('detail-meta').innerHTML = `${item.url ? `<a href="#" onclick="return false;" style="color:#3498db;">${item.url}</a>` : ''}<br>${t('date')}: ${formatDate(item.savedAt)}`;
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
    if (!confirm(t('confirmClearHistory'))) return;
    try {
        await chrome.storage.local.remove(['history']);
        loadHistory(); hideDetail();
    } catch (err) { console.error('清空历史失败:', err); }
}

function copyDetailContent() {
    if (!currentDetailItem) return;
    navigator.clipboard.writeText(currentDetailItem.content).then(() => {
        alert(t('copied'));
    }).catch(() => { alert(t('copyFailed')); });
}

async function exportDetailContent() {
    if (!currentDetailItem) return;
    try {
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: (currentDetailItem.title || 'untitled').substring(0, 50).replace(/[<>:"/\\|?*]/g, '') + '.md',
            types: [{ description: 'Markdown文件', accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] } }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(currentDetailItem.markdown || currentDetailItem.content);
        await writable.close();
        alert(`${t('exported')}: ${fileHandle.name}`);
    } catch (err) { if (err.name !== 'AbortError') alert(`${t('exportFailed')}: ${err.message}`); }
}

async function deleteDetailContent() {
    if (!currentDetailItem) return;
    if (!confirm(t('confirmDelete'))) return;
    try {
        const result = await chrome.storage.local.get(['history']);
        const history = result.history || [];
        const newHistory = history.filter((_, i) => i !== history.indexOf(currentDetailItem));
        await chrome.storage.local.set({ history: newHistory });
        loadHistory(); hideDetail();
    } catch (err) { console.error('删除历史失败:', err); }
}

function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ==================== 打开 markdownmaster.site/editor/ 编辑 ====================
async function openEditMd(mode) {
    var isFull = mode === 'full';
    var content = '';

    if (isFull) {
        if (!extractedArticle.text) { showArticleStatus(t('pleaseExtract')); return; }
        content = '# ' + extractedArticle.title + '\n\n**来源**: ' + extractedArticle.url + '\n\n---\n\n' + extractedArticle.text;
    } else {
        if (!extractedArticle.summary) { showArticleStatus(t('pleaseGenerate')); return; }
        content = '# ' + extractedArticle.title + ' - ' + t('smartSummary') + '\n\n**来源**: ' + extractedArticle.url + '\n\n---\n\n' + extractedArticle.summary;
    }

    var KEY = '__knexio_md_content__';
    await chrome.storage.local.set({ [KEY]: content });

    var tab = await chrome.tabs.create({ url: 'https://markdownmaster.site/editor/', active: true });

    function onUpdated(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(onUpdated);
            setTimeout(function() {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['inject.js']
                }, function() {
                    if (chrome.runtime.lastError) {
                        console.error('注入失败:', chrome.runtime.lastError);
                    }
                });
            }, 1000);
        }
    }
    chrome.tabs.onUpdated.addListener(onUpdated);
}
