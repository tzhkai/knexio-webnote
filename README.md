# knexio WebNote 网页摘要笔记

> knexio 官方 Chrome 插件 - 一键保存网页内容，截屏+摘要+笔记三合一

[![Chrome Web Store](https://img.shields.io/badge/Chrome-安装插件-4285F4?logo=google-chrome)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.3.0-blue)](releases)

---

## 功能特性

### 1. 标签页管理
- 查看所有打开的标签页，一键切换
- 关闭其他标签，保持当前页面
- 按网站域名分组显示

### 2. 截屏工具
- 截取当前可见区域
- 自动滚动截取完整页面（Full Page Screenshot）
- 下载为 PNG 或复制到剪贴板

### 3. 文章摘要与全文提取
- 提取当前页面的完整文章内容
- 基于 TextRank 算法生成智能摘要
- 一键复制全文或摘要
- 将摘要保存到笔记

### 4. 笔记管理
- 本地存储，不怕关闭丢失
- 自动保存（输入防丢失）
- 导入/导出为 Markdown 文件
- 历史记录管理，查看、复制、导出、删除

### 5. 导出与收藏
- 导出文章/摘要为 Markdown 文件
- 收藏到 knexio.xyz 云端

---

## 安装方法

### 方式一：从 Chrome 商店安装（推荐）
> 商店审核通过后可用，敬请期待

### 方式二：开发者模式安装（当前版本）

1. 下载本仓库 `releases/v1.3.0` 文件夹
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角 **开发者模式**
4. 点击 **加载已解压的扩展程序**
5. 选择下载的 `v1.3.0` 文件夹

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| [v1.3.0](releases/v1.3.0) | 2026-05-08 | 首发版本：标签页管理/截屏/摘要/笔记/导出 |

---

## 后续更新计划

- [ ] Chrome Web Store 上架
- [ ] 支持更多语言（English）
- [ ] 云端同步（knexio 账号）
- [ ] 快捷键支持
- [ ] 暗色模式

---

## 文件结构

```
knexio-webnote/
├── releases/
│   └── v1.3.0/              # 当前版本
│       ├── manifest.json
│       ├── popup.html
│       ├── popup.js
│       ├── sidepanel.html
│       ├── background.js
│       ├── content.js
│       └── icons/
├── README.md
└── LICENSE
```

---

## 关于 knexio

[knexio.xyz](https://knexio.xyz) - 发现最好的在线工具与资源

- [工具导航](https://knexio.xyz/tools) - 各类实用工具集合
- [财务工具](https://knexio.xyz/finance) - 投资理财资源
- [网页游戏](https://knexio.xyz/games) - 休闲游戏合集

---

## License

MIT License - 欢迎自由使用、修改和分发
