// inject.js — 由 popup.js 通过 chrome.scripting.executeScript 注入
// 从 chrome.storage.local 读取 __knexio_md_content__ 并填入编辑器

(function() {
    var KEY = '__knexio_md_content__';

    function tryFill(val) {
        var selectors = [
            '#editor',
            'textarea#editor',
            '.CodeMirror',
            '.cm-editor',
            'textarea[name="content"]',
            'textarea',
            '[contenteditable="true"]'
        ];
        for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (!el) continue;
            try {
                // CodeMirror 5
                if (selectors[i].indexOf('CodeMirror') !== -1 && el.CodeMirror) {
                    el.CodeMirror.setValue(val);
                    return true;
                }
                // CodeMirror 6 — 尝试从 DOM 找 view
                if (el.classList && el.classList.contains('cm-editor')) {
                    var ta = el.querySelector('textarea');
                    if (ta) {
                        ta.value = val;
                        ta.dispatchEvent(new Event('input', { bubbles: true }));
                        return true;
                    }
                }
                if (el.isContentEditable) {
                    el.focus();
                    document.execCommand('insertText', false, val);
                    return true;
                }
                if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                    el.value = val;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                }
            } catch (e) {}
        }
        return false;
    }

    function doWork() {
        chrome.storage.local.get(KEY, function(result) {
            var val = result && result[KEY];
            if (!val) return;
            if (tryFill(val)) {
                chrome.storage.local.remove(KEY);
            } else {
                // 编辑器未就绪，重试
                var retries = 0;
                var timer = setInterval(function() {
                    if (tryFill(val) || ++retries > 15) {
                        clearInterval(timer);
                        if (tryFill(val)) chrome.storage.local.remove(KEY);
                    }
                }, 500);
            }
        });
    }

    // 等 DOM 完全就绪
    if (document.readyState === 'complete') {
        setTimeout(doWork, 100);
    } else {
        window.addEventListener('load', function() { setTimeout(doWork, 100); });
    }
})();
