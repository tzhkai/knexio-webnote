// ==================== 内容脚本 ====================
// 用于完整页面截屏和文章内容提取

(function() {
    'use strict';

    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
            switch (request.action) {
                case 'getPageSize':
                    sendResponse({
                        contentWidth: Math.max(
                            document.documentElement.scrollWidth,
                            document.body.scrollWidth
                        ),
                        contentHeight: Math.max(
                            document.documentElement.scrollHeight,
                            document.body.scrollHeight
                        )
                    });
                    break;

                case 'scrollTo':
                    window.scrollTo(0, request.y);
                    sendResponse({ success: true });
                    break;

                case 'extractArticle':
                    const article = extractArticleContent();
                    sendResponse(article);
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (err) {
            sendResponse({ error: err.message });
        }
        return true;
    });

    // 提取文章内容
    function extractArticleContent() {
        // 获取标题
        const title = document.querySelector('h1')?.textContent?.trim() ||
                      document.querySelector('[class*="title"]')?.textContent?.trim() ||
                      document.title;

        let text = '';

        // 尝试多种方式提取正文
        const selectors = [
            'article',
            '[role="main"]',
            '.article-content',
            '.article-body',
            '.post-content',
            '.entry-content',
            '.content-body',
            '.story-body',
            'main',
            '#article',
            '#content',
            '.content'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.length > 500) {
                text = cleanText(element.textContent);
                if (text.length > 200) break;
            }
        }

        // 收集所有段落
        if (!text || text.length < 200) {
            const paragraphs = document.querySelectorAll('p');
            const texts = [];
            paragraphs.forEach(p => {
                const cleaned = cleanText(p.textContent);
                if (cleaned.length > 30) {
                    texts.push(cleaned);
                }
            });
            if (texts.length > 0) {
                text = texts.join('\n\n');
            }
        }

        // 清理噪音
        if (!text || text.length < 200) {
            const clone = document.body.cloneNode(true);
            const noiseSelectors = [
                'script', 'style', 'nav', 'header', 'footer', 'aside',
                '.nav', '.menu', '.sidebar', '.ad', '.advertisement',
                '.social', '.share', '.comment', '.related', '.footer',
                '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'
            ];
            noiseSelectors.forEach(selector => {
                clone.querySelectorAll(selector).forEach(el => el.remove());
            });
            text = cleanText(clone.textContent);
        }

        return {
            title: title || '',
            content: '',
            text: text || ''
        };
    }

    // 清理文本
    function cleanText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();
    }
})();