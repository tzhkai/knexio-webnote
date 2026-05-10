// i18n.js — 双语支持（中文/English）
// 根据浏览器语言自动切换，默认中文

const LOCALES = {
  zh_CN: {
    extName: 'knexio WebNote 网页摘要笔记',
    extDesc: 'knexio官方网页摘要笔记插件 - 标签页管理、截屏、文章摘要提取与笔记保存，一键整理网页内容',
    // 导航标签
    tab_tabs: '标签页',
    tab_screenshot: '截屏',
    tab_notes: '笔记',
    tab_article: '摘要',
    tab_history: '历史',
    // 标签页管理
    openTabs: '打开的标签页',
    noTabs: '没有打开的标签页',
    closeOthers: '关闭其他标签',
    groupByDomain: '按网站分组',
    // 笔记
    notes: '笔记',
    notePlaceholder: '在此输入笔记内容...',
    save: '💾 保存',
    load: '📂 加载',
    clear: '🗑️ 清空',
    export: '📁 导出到文件',
    import: '📥 导入文件',
    savedAt: '📍 保存位置',
    // 截屏
    screenshotTool: '截屏工具',
    captureVisible: '📷 截取可见区域',
    captureFullPage: '📄 截取完整页面',
    // 文章摘要
    articleExtract: '文章摘要与全文提取',
    clickToExtract: '点击下方按钮提取当前页面内容',
    extractArticle: '📝 提取全文',
    generateSummary: '✨ 生成摘要',
    copyArticle: '📋 复制全文',
    smartSummary: '智能摘要',
    clickToSummary: '点击"生成摘要"获取智能摘要',
    copySummary: '📋 复制摘要',
    saveToNote: '💾 保存到笔记',
    exportArticle: '📁 导出全文MD',
    exportSummary: '📁 导出摘要MD',
    editFullMd: '✏️ 编辑全文MD',
    editSummaryMd: '✏️ 编辑摘要MD',
    // 历史
    history: '历史记录',
    noHistory: '暂无历史记录',
    clearHistory: '🗑️ 清空历史',
    copy: '📋 复制',
    exportMD: '📁 导出MD',
    delete: '🗑️ 删除',
    // 状态消息
    saved: '✅ 已保存',
    loaded: '✅ 已加载',
    cleared: '🗑️ 已清空',
    autoSaved: '✅ 已自动保存',
    exported: '✅ 已导出',
    copied: '✅ 已复制到剪贴板',
    savedToNote: '✅ 已保存到笔记和历史',
    noteEmpty: '⚠️ 笔记为空，无内容可导出',
    pleaseExtract: '⚠️ 请先提取文章内容',
    pleaseGenerate: '⚠️ 请先生成摘要',
    extracting: '正在提取文章内容...',
    generating: '✨ 正在生成摘要...',
    capturing: '截取中...',
    capturingFull: '正在截取完整页面...',
    extractedChars: (n) => `✅ 已提取 ${n} 字`,
    // 错误
    saveFailed: '保存失败',
    loadFailed: '加载失败',
    clearFailed: '清空失败',
    exportFailed: '导出失败',
    copyFailed: '复制失败',
    screenshotFailed: '截屏失败',
    fullScreenshotFailed: '完整页面截屏失败',
    extractFailed: '无法提取文章内容',
    extractFailedReason: '可能原因：页面需要登录才能查看；页面使用特殊技术加载；页面主要内容在iframe中',
    // 确认
    confirmClear: '确定要清空笔记吗？',
    confirmClearHistory: '确定要清空所有历史记录吗？',
    confirmDelete: '确定要删除这条记录吗？',
    // 历史详情
    source: '来源',
    date: '保存时间',
    noTitle: '无标题',
    unknownDomain: '未知网站',
    // 品牌区
    brand: 'KNEXIO',
    brandTools: 'Tools',
    brandFree: '免费',
    brandOfficial: '官网',
    brandToolsNav: '工具导航',
    brandFinance: '财务工具',
    brandGames: '网页游戏',
  },
  en: {
    extName: 'knexio WebNote - Summary & Notes',
    extDesc: 'knexio official web notes extension - tab management, screenshot, article extraction and note saving',
    tab_tabs: 'Tabs',
    tab_screenshot: 'Screenshot',
    tab_notes: 'Notes',
    tab_article: 'Summary',
    tab_history: 'History',
    openTabs: 'Open Tabs',
    noTabs: 'No open tabs',
    closeOthers: 'Close Others',
    groupByDomain: 'Group by Site',
    notes: 'Notes',
    notePlaceholder: 'Enter your notes here...',
    save: '💾 Save',
    load: '📂 Load',
    clear: '🗑️ Clear',
    export: '📁 Export to File',
    import: '📥 Import File',
    savedAt: '📍 Saved at',
    screenshotTool: 'Screenshot Tool',
    captureVisible: '📷 Visible Area',
    captureFullPage: '📄 Full Page',
    articleExtract: 'Article Summary & Extraction',
    clickToExtract: 'Click the button below to extract current page content',
    extractArticle: '📝 Extract Full Text',
    generateSummary: '✨ Generate Summary',
    copyArticle: '📋 Copy Full Text',
    smartSummary: 'Smart Summary',
    clickToSummary: 'Click "Generate Summary" to get smart summary',
    copySummary: '📋 Copy Summary',
    saveToNote: '💾 Save to Notes',
    exportArticle: '📁 Export Full Text MD',
    exportSummary: '📁 Export Summary MD',
    editFullMd: '✏️ Edit Full Text MD',
    editSummaryMd: '✏️ Edit Summary MD',
    history: 'History',
    noHistory: 'No history yet',
    clearHistory: '🗑️ Clear History',
    copy: '📋 Copy',
    exportMD: '📁 Export MD',
    delete: '🗑️ Delete',
    saved: '✅ Saved',
    loaded: '✅ Loaded',
    cleared: '🗑️ Cleared',
    autoSaved: '✅ Auto-saved',
    exported: '✅ Exported',
    copied: '✅ Copied to clipboard',
    savedToNote: '✅ Saved to notes and history',
    noteEmpty: '⚠️ Note is empty, nothing to export',
    pleaseExtract: '⚠️ Please extract article content first',
    pleaseGenerate: '⚠️ Please generate a summary first',
    extracting: 'Extracting article content...',
    generating: '✨ Generating summary...',
    capturing: 'Capturing...',
    capturingFull: 'Capturing full page...',
    extractedChars: (n) => `✅ Extracted ${n} characters`,
    saveFailed: 'Save failed',
    loadFailed: 'Load failed',
    clearFailed: 'Clear failed',
    exportFailed: 'Export failed',
    copyFailed: 'Copy failed',
    screenshotFailed: 'Screenshot failed',
    fullScreenshotFailed: 'Full page screenshot failed',
    extractFailed: 'Unable to extract article content',
    extractFailedReason: 'Possible reasons: page requires login; page uses special loading techniques; main content is in an iframe',
    confirmClear: 'Are you sure you want to clear the note?',
    confirmClearHistory: 'Are you sure you want to clear all history?',
    confirmDelete: 'Are you sure you want to delete this record?',
    source: 'Source',
    date: 'Saved at',
    noTitle: 'Untitled',
    unknownDomain: 'Unknown Site',
    brand: 'KNEXIO',
    brandTools: 'Tools',
    brandFree: 'Free',
    brandOfficial: 'Official',
    brandToolsNav: 'Tools',
    brandFinance: 'Finance',
    brandGames: 'Games',
  }
};

// 检测语言
function getLocale() {
  const lang = (navigator.language || navigator.userLanguage || 'zh').toLowerCase();
  return lang.startsWith('zh') ? 'zh_CN' : 'en';
}

const locale = getLocale();
const T = LOCALES[locale] || LOCALES.zh_CN;

// 翻译函数
function t(key, ...args) {
  let s = T[key] || LOCALES.zh_CN[key] || key;
  if (typeof s === 'function') s = s(...args);
  if (args.length > 0 && typeof s === 'string') {
    args.forEach((a, idx) => { s = s.replace(`$${idx+1}`, a); });
  }
  return s;
}

// 应用翻译到 HTML（在 DOMContentLoaded 时调用）
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = t(key);
    if (msg && el.children.length === 0) {
      el.textContent = msg;
    }
  });
  // placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
}

document.addEventListener('DOMContentLoaded', applyI18n);
